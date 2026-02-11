import {
  NearBindgen,
  call,
  view,
  near,
  LookupMap,
  NearPromise,
  assert,
} from "near-sdk-js";

// 1 yoctoNEAR for ft_transfer security
const ONE_YOCTO = BigInt("1");
// 100 TGas for ft_transfer cross-contract call
const FT_TRANSFER_GAS = BigInt("50000000000000");

type EscrowStatus =
  | "funded"
  | "confirmed"
  | "disputed"
  | "refunded"
  | "released";

interface Escrow {
  id: string;
  buyer: string;
  seller: string;
  token_contract: string;
  amount: string;
  status: EscrowStatus;
  created_at: string;
  timeout_at: string;
  description: string;
  dispute_reason: string | null;
}

@NearBindgen({})
class ShieldEscrow {
  admin: string = "";
  escrow_count: number = 0;
  escrows: LookupMap<string> = new LookupMap<string>("e");

  static schema = {
    admin: "string",
    escrow_count: "number",
    escrows: { class: LookupMap, value: "string" },
  };

  // --- Initialize ---
  @call({})
  init({ admin }: { admin: string }): void {
    assert(this.admin === "", "Already initialized");
    this.admin = admin;
    near.log(`Shield Escrow initialized. Admin: ${admin}`);
  }

  // --- NEP-141 ft_on_transfer callback ---
  // Called by the USDC token contract when someone does ft_transfer_call to this contract
  // msg format: {"seller":"merchant.near","description":"Widget","timeout_minutes":1440}
  @call({})
  ft_on_transfer({
    sender_id,
    amount,
    msg,
  }: {
    sender_id: string;
    amount: string;
    msg: string;
  }): string {
    const tokenContract = near.predecessorAccountId();

    // Parse msg
    let parsed: { seller: string; description: string; timeout_minutes?: number };
    try {
      parsed = JSON.parse(msg);
    } catch {
      near.log("ERROR: Invalid msg JSON, refunding");
      return amount; // refund all
    }

    assert(parsed.seller && parsed.seller.length > 0, "Missing seller");
    assert(
      parsed.description && parsed.description.length > 0,
      "Missing description"
    );

    const timeoutMinutes = parsed.timeout_minutes || 1440; // default 24h
    const nowNs = near.blockTimestamp();
    const timeoutNs = nowNs + BigInt(timeoutMinutes) * BigInt(60) * BigInt(1000000000);

    const escrowId = `escrow_${this.escrow_count}`;
    const escrow: Escrow = {
      id: escrowId,
      buyer: sender_id,
      seller: parsed.seller,
      token_contract: tokenContract,
      amount: amount,
      status: "funded",
      created_at: nowNs.toString(),
      timeout_at: timeoutNs.toString(),
      description: parsed.description,
      dispute_reason: null,
    };

    this.escrows.set(escrowId, JSON.stringify(escrow));
    this.escrow_count += 1;

    near.log(
      `Escrow created: ${escrowId} | buyer=${sender_id} seller=${parsed.seller} amount=${amount} token=${tokenContract}`
    );

    // Return "0" = keep all tokens in escrow
    return "0";
  }

  // --- Buyer confirms delivery → release funds to seller ---
  @call({})
  confirm_delivery({ escrow_id }: { escrow_id: string }): NearPromise {
    const escrow = this._getEscrow(escrow_id);
    const caller = near.predecessorAccountId();

    assert(escrow.status === "funded", "Escrow not in funded state");
    assert(caller === escrow.buyer, "Only buyer can confirm delivery");

    // Update status
    escrow.status = "released";
    this.escrows.set(escrow_id, JSON.stringify(escrow));

    near.log(
      `Escrow ${escrow_id}: buyer confirmed delivery, releasing ${escrow.amount} to ${escrow.seller}`
    );

    // Transfer tokens to seller
    return NearPromise.new(escrow.token_contract).functionCall(
      "ft_transfer",
      JSON.stringify({
        receiver_id: escrow.seller,
        amount: escrow.amount,
      }),
      ONE_YOCTO,
      FT_TRANSFER_GAS
    );
  }

  // --- Timeout refund: anyone can call if timeout has passed ---
  @call({})
  claim_timeout_refund({ escrow_id }: { escrow_id: string }): NearPromise {
    const escrow = this._getEscrow(escrow_id);

    assert(
      escrow.status === "funded",
      "Escrow not in funded state"
    );

    const now = near.blockTimestamp();
    const timeout = BigInt(escrow.timeout_at);
    assert(now >= timeout, "Timeout not reached yet");

    // Update status
    escrow.status = "refunded";
    this.escrows.set(escrow_id, JSON.stringify(escrow));

    near.log(
      `Escrow ${escrow_id}: timeout reached, refunding ${escrow.amount} to ${escrow.buyer}`
    );

    // Transfer tokens back to buyer
    return NearPromise.new(escrow.token_contract).functionCall(
      "ft_transfer",
      JSON.stringify({
        receiver_id: escrow.buyer,
        amount: escrow.amount,
      }),
      ONE_YOCTO,
      FT_TRANSFER_GAS
    );
  }

  // --- Buyer opens dispute ---
  @call({})
  open_dispute({
    escrow_id,
    reason,
  }: {
    escrow_id: string;
    reason: string;
  }): void {
    const escrow = this._getEscrow(escrow_id);
    const caller = near.predecessorAccountId();

    assert(escrow.status === "funded", "Escrow not in funded state");
    assert(caller === escrow.buyer, "Only buyer can open dispute");
    assert(reason && reason.length > 0, "Reason required");

    escrow.status = "disputed";
    escrow.dispute_reason = reason;
    this.escrows.set(escrow_id, JSON.stringify(escrow));

    near.log(
      `Escrow ${escrow_id}: dispute opened by ${caller}. Reason: ${reason}`
    );
  }

  // --- Admin resolves dispute ---
  @call({})
  resolve_dispute({
    escrow_id,
    release_to_seller,
  }: {
    escrow_id: string;
    release_to_seller: boolean;
  }): NearPromise {
    const escrow = this._getEscrow(escrow_id);
    const caller = near.predecessorAccountId();

    assert(caller === this.admin, "Only admin can resolve disputes");
    assert(escrow.status === "disputed", "Escrow not in disputed state");

    const recipient = release_to_seller ? escrow.seller : escrow.buyer;
    escrow.status = release_to_seller ? "released" : "refunded";
    this.escrows.set(escrow_id, JSON.stringify(escrow));

    near.log(
      `Escrow ${escrow_id}: dispute resolved by admin. Funds → ${recipient}`
    );

    return NearPromise.new(escrow.token_contract).functionCall(
      "ft_transfer",
      JSON.stringify({
        receiver_id: recipient,
        amount: escrow.amount,
      }),
      ONE_YOCTO,
      FT_TRANSFER_GAS
    );
  }

  // --- View methods ---

  @view({})
  get_escrow({ escrow_id }: { escrow_id: string }): Escrow | null {
    const data = this.escrows.get(escrow_id);
    if (!data) return null;
    return JSON.parse(data) as Escrow;
  }

  @view({})
  get_escrow_count(): number {
    return this.escrow_count;
  }

  @view({})
  get_admin(): string {
    return this.admin;
  }

  @view({})
  get_escrows_by_buyer({
    buyer,
    from_index,
    limit,
  }: {
    buyer: string;
    from_index?: number;
    limit?: number;
  }): Escrow[] {
    const start = from_index || 0;
    const max = limit || 20;
    const results: Escrow[] = [];

    for (let i = start; i < this.escrow_count && results.length < max; i++) {
      const data = this.escrows.get(`escrow_${i}`);
      if (data) {
        const escrow = JSON.parse(data) as Escrow;
        if (escrow.buyer === buyer) {
          results.push(escrow);
        }
      }
    }
    return results;
  }

  @view({})
  get_escrows_by_seller({
    seller,
    from_index,
    limit,
  }: {
    seller: string;
    from_index?: number;
    limit?: number;
  }): Escrow[] {
    const start = from_index || 0;
    const max = limit || 20;
    const results: Escrow[] = [];

    for (let i = start; i < this.escrow_count && results.length < max; i++) {
      const data = this.escrows.get(`escrow_${i}`);
      if (data) {
        const escrow = JSON.parse(data) as Escrow;
        if (escrow.seller === seller) {
          results.push(escrow);
        }
      }
    }
    return results;
  }

  // --- Internal helpers ---

  private _getEscrow(escrowId: string): Escrow {
    const data = this.escrows.get(escrowId);
    assert(data !== null, `Escrow ${escrowId} not found`);
    return JSON.parse(data!) as Escrow;
  }
}
