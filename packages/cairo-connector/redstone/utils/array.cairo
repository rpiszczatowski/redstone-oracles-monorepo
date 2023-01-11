from starkware.cairo.common.serialize import serialize_word
from starkware.cairo.common.math import assert_nn, split_felt
from starkware.cairo.common.alloc import alloc
from starkware.cairo.common.cairo_secp.bigint import BigInt3, bigint_to_uint256

struct Array {
    ptr: felt*,
    len: felt,
}

func array_slice_tail_offset{range_check_ptr}(arr: Array, len: felt, tail_offset: felt) -> (
    head: Array, tail: Array
) {
    alloc_locals;

    assert_nn(len);

    let head_len = arr.len - tail_offset - len;
    assert_nn(head_len);

    local head: Array = Array(ptr=arr.ptr, len=head_len);
    local tail: Array = Array(ptr=arr.ptr + head_len, len=len);

    return (head=head, tail=tail);
}

func array_slice_tail{range_check_ptr}(arr: Array, len: felt) -> (head: Array, tail: Array) {
    return array_slice_tail_offset(arr=arr, len=len, tail_offset=0);
}

func array_slice_number{range_check_ptr}(arr: Array, len: felt) -> (head: Array, number: felt) {
    alloc_locals;

    let (head, tail) = array_slice_tail_offset(arr=arr, len=len, tail_offset=0);
    let number = array_to_number(tail);

    return (head=head, number=number);
}

func array_to_number{range_check_ptr}(arr: Array) -> felt {
    alloc_locals;

    assert_nn(arr.len);

    let (res_ptr) = alloc();
    array_to_number_rec(ptr=arr.ptr, len=arr.len, mlt=1, acc=0, res=res_ptr);

    return [res_ptr];
}

func array_to_number_rec{range_check_ptr}(ptr: felt*, len: felt, mlt: felt, acc: felt, res: felt*) {
    if (len == 0) {
        [res] = acc;

        return ();
    }

    let last = [ptr + len - 1];

    return array_to_number_rec(ptr=ptr, len=len - 1, mlt=mlt * 256, acc=acc + mlt * last, res=res);
}

func array_to_string{range_check_ptr}(arr: Array) -> felt {
    let trunc_arr = array_trunc(arr);
    return array_to_number(trunc_arr);
}

func array_trunc{range_check_ptr}(arr: Array) -> Array {
    alloc_locals;

    assert_nn(arr.len);

    let (res_ptr: Array*) = alloc();
    assert res_ptr.ptr = arr.ptr;

    _array_trunc(ptr=arr.ptr, len=arr.len, last_is_zero=1, res=res_ptr);

    return [res_ptr];
}

func _array_trunc{range_check_ptr}(ptr: felt*, len: felt, last_is_zero: felt, res: Array*) {
    alloc_locals;

    if (len * last_is_zero == 0) {
        assert res.len = len;

        return ();
    }

    let last = [ptr + len - 1];
    local is_zero;
    if (last == 0) {
        is_zero = 1;
    } else {
        is_zero = 0;
    }

    return _array_trunc(ptr=ptr, len=len - 1, last_is_zero=is_zero, res=res);
}

func array_join(arr: Array, join: Array) -> Array {
    alloc_locals;

    let (ptr) = alloc();
    local res: Array = Array(ptr=arr.ptr, len=arr.len + join.len);

    array_join_rec(offset=arr.len, join=join, index=0, res=res);

    return res;
}

func array_join_rec(offset: felt, join: Array, index: felt, res: Array) {
    if (offset + index == res.len) {
        return ();
    }

    assert res.ptr[offset + index] = join.ptr[index];

    return array_join_rec(offset=offset, join=join, index=index + 1, res=res);
}

func serialize_safe_array{output_ptr: felt*, range_check_ptr}(arr: Array, index: felt) {
    if (index == arr.len) {
        return ();
    }

    serialize_word(arr.ptr[index]);

    return serialize_safe_array(arr=arr, index=index + 1);
}
