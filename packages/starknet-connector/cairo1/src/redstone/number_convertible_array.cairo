use array::array_snapshot_pop_back;
use array::ArrayTrait;
use integer::u8_to_felt252;
use integer::u32_to_felt252;
use integer::u256_from_felt252;
use integer::u256_checked_add;
use integer::u256_checked_mul;

use redstone::sliceable_array::SliceableArrayTrait;

#[derive(Copy, Drop)]
struct NumberArraySlice {
    head: @Array<u8>,
    number: felt252
}

trait NumberConvertibleArrayTrait {
    fn slice_number_offset(self: @Array<u8>, length: usize, offset: usize) -> NumberArraySlice;
    fn slice_number(self: @Array<u8>, length: usize) -> NumberArraySlice;
    fn to_felt252(self: @Array<u8>) -> felt252;
    fn to_u256(self: @Array<u8>) -> u256;
    fn to_string_number(self: @Array<u8>) -> felt252;
}

impl NumberConvertibleArray of NumberConvertibleArrayTrait {
    fn slice_number(self: @Array<u8>, len: usize) -> NumberArraySlice {
        self.slice_number_offset(len, 0_usize)
    }

    fn slice_number_offset(self: @Array<u8>, len: usize, offset: usize) -> NumberArraySlice {
        let slice = self.slice_tail_offset(len, offset);

        NumberArraySlice { head: slice.head, number: slice.tail.to_felt252() }
    }

    fn to_felt252(self: @Array<u8>) -> felt252 {
        assert(self.len() <= 32_usize, 'Array size to big');

        array_to_felt252(self, self.len(), 1, 0)
    }

    fn to_u256(self: @Array<u8>) -> u256 {
        assert(self.len() <= 32_usize, 'Array size to big');

        array_to_u256(self, self.len(), u256_from_felt252(1), u256_from_felt252(0))
    }

    fn to_string_number(self: @Array<u8>) -> felt252 {
        array_trunc(self).to_felt252()
    }
}


fn array_to_felt252(arr: @Array<u8>, len: usize, mlt: felt252, acc: felt252) -> felt252 {
    if (len == 0_u32) {
        return acc;
    }

    let last = *arr[len - 1_usize];

    array_to_felt252(arr, len - 1_usize, mlt * 256, acc + mlt * u8_to_felt252(last))
}


fn array_to_u256(arr: @Array<u8>, len: usize, mlt: u256, acc: u256) -> u256 {
    if (len == 0_u32) {
        return acc;
    }

    let last = *arr[len - 1_usize];
    let sum = acc + mlt * u256_from_felt252(u8_to_felt252(last));
    let new_mlt = (match u256_checked_mul(u256_from_felt252(256), mlt) {
        Option::Some(value) => value,
        Option::None(_) => u256_from_felt252(0),
    });

    array_to_u256(arr, len - 1_usize, new_mlt, sum)
}

fn array_trunc(arr: @Array<u8>) -> @Array<u8> {
    let mut res: @Array<u8> = arr;

    _array_trunc(ref res);

    res
}

fn _array_trunc(ref arr: @Array<u8>) {
    if (arr.len() == 0_usize) {
        return ();
    }

    let last = *arr[arr.len() - 1_usize];
    if last != 0_u8 {
        return ();
    }

    array_snapshot_pop_back(ref arr);

    _array_trunc(ref arr)
}
