use integer::u256_from_felt252;
use integer::u128_to_felt252;
use integer::u128_from_felt252;

impl Felt252PartialOrd of PartialOrd<felt252> {
    #[inline(always)]
    fn le(a: felt252, b: felt252) -> bool {
        !(b < a)
    }
    #[inline(always)]
    fn ge(a: felt252, b: felt252) -> bool {
        !(a < b)
    }
    #[inline(always)]
    fn lt(a: felt252, b: felt252) -> bool {
        u256_from_felt252(a) < u256_from_felt252(b)
    }
    #[inline(always)]
    fn gt(a: felt252, b: felt252) -> bool {
        b < a
    }
}

impl Felt252Div of Div<core::felt252> {
    //TODO: change to u256
    fn div(a: felt252, b: felt252) -> felt252 {
        u128_to_felt252(u128_from_felt252(a) / u128_from_felt252(b))
    }
}
