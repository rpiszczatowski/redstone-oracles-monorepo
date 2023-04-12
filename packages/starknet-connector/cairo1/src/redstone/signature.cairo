use array::ArrayTrait;

use redstone::constants::SIGNATURE_BS;
use redstone::sliceable_array::SliceableArrayTrait;

#[derive(Drop, Copy)]
struct Signature {
    r_bytes: @Array<u8>,
    s_bytes: @Array<u8>,
    v: u8,
}

fn get_signature_from_bytes(arr: @Array<u8>) -> Signature {
    assert(arr.len() == SIGNATURE_BS, 'Wrong array size');

    let v = *arr[arr.len() - 1_usize];
    let slice = arr.slice_tail_offset(32_usize, 1_usize);

    Signature { r_bytes: slice.head, s_bytes: slice.tail, v }
}

