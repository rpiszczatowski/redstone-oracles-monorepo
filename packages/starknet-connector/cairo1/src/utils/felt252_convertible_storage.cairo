use option::OptionTrait;
use result::ResultTrait;

use starknet::syscalls::storage_read_syscall;
use starknet::syscalls::storage_write_syscall;
use starknet::syscalls::SyscallResult;
use starknet::StorageBaseAddress;
use starknet::StorageAccess;
use starknet::storage_address_from_base_and_offset;

use utils::felt252_convertible::Felt252Convertible;

impl StorageAccessFelt252Convertible<
    T, impl TFelt252Convertible: Felt252Convertible<T>
> of StorageAccess<T> {
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
