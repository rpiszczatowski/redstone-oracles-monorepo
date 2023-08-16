use array::ArrayTrait;
use traits::Into;

use redstone::constants::SIGNATURE_BS;
use redstone::sliceable_array::SliceableArrayTrait;

#[derive(Drop, Copy)]
struct RedstoneSignature {
    r_bytes: @Array<u8>,
    s_bytes: @Array<u8>,
    v: u32,
}

fn get_signature_from_bytes(arr: @Array<u8>) -> RedstoneSignature {
    assert(arr.len() == SIGNATURE_BS, 'Wrong array size');

    let v = *arr[arr.len() - 1_usize];
    let slice = arr.slice_tail_offset(32_usize, 1_usize);

    RedstoneSignature { r_bytes: slice.head, s_bytes: slice.tail, v: v.into() }
}
//TODO: impl RedstoneSignature.into<Signature>


