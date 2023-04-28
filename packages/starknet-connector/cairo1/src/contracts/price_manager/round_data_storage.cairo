use option::OptionTrait;
use result::ResultTrait;

use starknet::syscalls::storage_read_syscall;
use starknet::syscalls::storage_write_syscall;
use starknet::syscalls::SyscallResult;
use starknet::StorageBaseAddress;
use starknet::StorageAccess;
use starknet::storage_address_from_base_and_offset;

use redstone::u64tuple_convertible::U64TupleConvertible;
use redstone::u64tuple_convertible::U64TupleFelt252Convertible;
use redstone::u64tuple_convertible::TupleSize4PartialEq;
use redstone::u64tuple_convertible::U64_TUPLE_MAX_A;
use redstone::felt252_convertible::Felt252Convertible;

use interface::round_data::RoundData;

impl RoundDataU64TupleConvertible of U64TupleConvertible<RoundData> {
    fn from_u64_tuple(a: u64, b: u64, c: u64, d: u64) -> RoundData {
        RoundData { round_number: a, payload_timestamp: b, block_number: c, block_timestamp: d }
    }
    fn to_u64_tuple(self: RoundData) -> (u64, u64, u64, u64, ) {
        (self.round_number, self.payload_timestamp, self.block_number, self.block_timestamp)
    }
}

impl StorageAccessU64TupleConvertible<T,
impl TFelt252Convertible: Felt252Convertible<T>> of StorageAccess<T> {
    #[inline(always)]
    fn read(address_domain: u32, base: StorageBaseAddress) -> SyscallResult<T> {
        let value = StorageAccess::<felt252>::read(address_domain, base).unwrap();
        let data = Felt252Convertible::from_felt252(value);

        Result::Ok(data)
    }

    #[inline(always)]
    fn write(address_domain: u32, base: StorageBaseAddress, value: T) -> SyscallResult<()> {
        StorageAccess::<felt252>::write(address_domain, base, value.to_felt252())
    }
}
