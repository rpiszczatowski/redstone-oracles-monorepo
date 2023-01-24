from starkware.cairo.common.cairo_secp.bigint import BigInt3
from starkware.cairo.common.serialize import serialize_word

from redstone.utils.array import Array, array_slice_tail_offset, array_to_number
from redstone.protocol.constants import SIGNATURE_BS
from redstone.utils.bigint import bigint_from_array, serialize_bigint

struct Signature {
    r: felt,
    s: felt,
    v: felt,
}

func get_signature{range_check_ptr}(bytes_arr: Array) -> Signature {
    alloc_locals;

    assert bytes_arr.len = SIGNATURE_BS;

    local signature: Signature;

    let (r_arr, s_arr) = array_slice_tail_offset(bytes_arr, 32, 1);
    let r = array_to_number(r_arr);
    assert signature.r = r;

    let s = array_to_number(s_arr);
    assert signature.s = s;

    assert signature.v = [bytes_arr.ptr + 64];

    return signature;
}

func serialize_signature{output_ptr: felt*, range_check_ptr}(sig: Signature) {
    alloc_locals;

    serialize_word(sig.r);
    serialize_word(sig.s);
    serialize_word(sig.v);

    return ();
}
