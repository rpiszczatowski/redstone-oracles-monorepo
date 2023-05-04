use integer::Into;
use integer::TryInto;
use integer::u256_from_felt252;
use integer::u128_safe_divmod;
use integer::u128_as_non_zero;
use option::OptionTrait;

use utils::felt252_convertible::Felt252Convertible;

const U64_TUPLE_MAX_A: u64 = 0x800000000000000;
const U64_BASE: felt252 = 0x10000000000000000;
const U64_BASE_u128: u128 = 0x10000000000000000_u128;

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

        let (a_u128, b_u128) = u128_safe_divmod(value_u256.high, u128_as_non_zero(U64_BASE_u128));
        let (c_u128, d_u128) = u128_safe_divmod(value_u256.low, u128_as_non_zero(U64_BASE_u128));

        U64TupleConvertible::from_u64_tuple(
            a: a_u128.try_into().unwrap(),
            b: b_u128.try_into().unwrap(),
            c: c_u128.try_into().unwrap(),
            d: d_u128.try_into().unwrap()
        )
    }

    fn to_felt252(self: T) -> felt252 {
        let (a, b, c, d) = self.to_u64_tuple();

        assert(a < U64_TUPLE_MAX_A, 'a overflow');

        a.into() * U64_BASE * U64_BASE * U64_BASE
            + b.into() * U64_BASE * U64_BASE
            + c.into() * U64_BASE
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

mod tests {
    use super::U64_TUPLE_MAX_A;
    use super::U64TupleFelt252Convertible;
    use super::U64TupleConvertible;
    use super::TupleSize4PartialEq;
    use utils::felt252_convertible::Felt252Convertible;

    const MAX_U64: u64 = 18446744073709551615;
    const MAX_FELT252: felt252 = 0x800000000000011000000000000000000000000000000000000000000000000;

    #[test]
    fn test_u64tuple_convertible() {
        test_u64tuple_felt252_conversion(
            (2, 546333400, 11, 1677563199), 0x200000000209062d8000000000000000b0000000063fd953f
        );
    }

    #[test]
    fn test_u64tuple_convertible_almost_max() {
        test_u64tuple_felt252_conversion(
            (13, MAX_U64, MAX_U64, MAX_U64), 0xdffffffffffffffffffffffffffffffffffffffffffffffff
        );
    }

    #[test]
    fn test_u64tuple_convertible_max_a() {
        test_u64tuple_felt252_conversion(
            (U64_TUPLE_MAX_A - 1, MAX_U64, MAX_U64, MAX_U64),
            0x7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
        );
    }

    #[should_panic]
    #[test]
    fn test_u64tuple_convertible_overflow() {
        test_u64tuple_felt252_conversion((U64_TUPLE_MAX_A, 0, 0, 0), 0x0);
    }

    fn test_u64tuple_felt252_conversion(tuple: (u64, u64, u64, u64), value: felt252) {
        assert(tuple.to_felt252() == value, 'Wrong Felt252 Conversion');

        let result: (u64, u64, u64, u64) = U64TupleFelt252Convertible::from_felt252(value);
        assert(result == tuple, 'Wrong Tuple Conversion');
    }
}
