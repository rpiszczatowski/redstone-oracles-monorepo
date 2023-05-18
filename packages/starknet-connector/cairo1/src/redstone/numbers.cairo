use integer::u256_from_felt252;
use integer::u128_to_felt252;
use integer::u128_from_felt252;

impl Felt252PartialOrd of PartialOrd<felt252> {
    #[inline(always)]
    fn le(lhs: felt252, rhs: felt252) -> bool {
        !(rhs < lhs)
    }
    #[inline(always)]
    fn ge(lhs: felt252, rhs: felt252) -> bool {
        !(lhs < rhs)
    }
    #[inline(always)]
    fn lt(lhs: felt252, rhs: felt252) -> bool {
        u256_from_felt252(lhs) < u256_from_felt252(rhs)
    }
    #[inline(always)]
    fn gt(lhs: felt252, rhs: felt252) -> bool {
        rhs < lhs
    }
}

impl Felt252Div of Div<core::felt252> {
    //TODO: change to u256
    fn div(lhs: felt252, rhs: felt252) -> felt252 {
        u128_to_felt252(u128_from_felt252(lhs) / u128_from_felt252(rhs))
    }
}
