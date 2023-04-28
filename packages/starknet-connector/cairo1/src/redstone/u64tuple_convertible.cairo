use integer::Into;
use integer::TryInto;
use integer::u256_from_felt252;
use integer::u128_safe_divmod;
use integer::u128_as_non_zero;
use option::OptionTrait;

use redstone::felt252_convertible::Felt252Convertible;

const U64_TUPLE_MAX_A: u64 = 0x800000000000000;

trait U64TupleConvertible<T> {
    fn from_u64_tuple(a: u64, b: u64, c: u64, d: u64) -> T;
    fn to_u64_tuple(self: T) -> (u64, u64, u64, u64, );
}

impl U64TupleU64TupleConvertible of U64TupleConvertible<(u64, u64, u64, u64, )> {
    fn from_u64_tuple(a: u64, b: u64, c: u64, d: u64) -> (u64, u64, u64, u64) {
        (a, b, c, d)
    }
    fn to_u64_tuple(self: (u64, u64, u64, u64)) -> (u64, u64, u64, u64, ) {
        self
    }
}

impl U64TupleFelt252Convertible<T,
impl TU64TupleConvertible: U64TupleConvertible<T>> of Felt252Convertible<T> {
    fn from_felt252(value: felt252) -> T {
        let value_u256 = u256_from_felt252(value);

        let (a_u128, b_u128) = u128_safe_divmod(
            value_u256.high, u128_as_non_zero(0x10000000000000000_u128)
        );

        let (c_u128, d_u128) = u128_safe_divmod(
            value_u256.low, u128_as_non_zero(0x10000000000000000_u128)
        );

        U64TupleConvertible::from_u64_tuple(
            a: a_u128.try_into().unwrap(),
            b: b_u128.try_into().unwrap(),
            c: c_u128.try_into().unwrap(),
            d: d_u128.try_into().unwrap()
        )
    }

    fn to_felt252(self: T) -> felt252 {
        let (a, b, c, d) = self.to_u64_tuple();

        assert(a <= U64_TUPLE_MAX_A, 'a overflow');

        a.into() * 0x10000000000000000 * 0x10000000000000000 * 0x10000000000000000
            + b.into() * 0x10000000000000000 * 0x10000000000000000
            + c.into() * 0x10000000000000000
            + d.into()
    }
}

impl TupleSize4PartialEq<E0,
impl E0PartialEq: PartialEq<E0>,
impl E0Drop: Drop<E0>> of PartialEq<(E0, E0, E0, E0, )> {
    #[inline(always)]
    fn eq(lhs: (E0, E0, E0, E0, ), rhs: (E0, E0, E0, E0, )) -> bool {
        let (a, b, c, d) = lhs;
        let (e, f, g, h) = rhs;

        if a != e {
            return false;
        } else if b != f {
            return false;
        } else if c != g {
            return false;
        }

        return d == h;
    }

    #[inline(always)]
    fn ne(lhs: (E0, E0, E0, E0, ), rhs: (E0, E0, E0, E0, )) -> bool {
        !(rhs == lhs)
    }
}
