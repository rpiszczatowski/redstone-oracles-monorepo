use array::ArrayTrait;
use array::Array;
use option::OptionTrait;
use result::ResultTrait;
use serde::Serde;
use traits::Into;
use traits::TryInto;

use starknet::syscalls::storage_read_syscall;
use starknet::syscalls::storage_write_syscall;
use starknet::syscalls::SyscallResult;
use starknet::StorageBaseAddress;
use starknet::StorageAccess;
use starknet::storage_address_from_base_and_offset;

use utils::gas::out_of_gas_array;

trait WrappedSerde<T> {} // to avoid multiple implementations of Serde for primitive types
impl ArrayWrappedSerde<U> of WrappedSerde<Array<U>> {}

impl StorageAccessSerde<
    T, impl TSerde: Serde<T>, impl TDrop: Drop<T>, impl TWrappedSerde: WrappedSerde<T>
> of StorageAccess<T> {
    #[inline(always)]
    fn read(address_domain: u32, base: StorageBaseAddress) -> SyscallResult<T> {
        let mut result = ArrayTrait::new();

        let size: usize = StorageAccess::<felt252>::read(address_domain, base)?
            .try_into()
            .expect('StorageAccessArray - non usize');

        _read(:address_domain, :base, :size, index: 0_u8, ref acc: result);
        let mut span = result.span();

        Result::Ok(Serde::<T>::deserialize(ref span).expect('Wrong structure'))
    }

    #[inline(always)]
    fn write(address_domain: u32, base: StorageBaseAddress, value: T) -> SyscallResult<()> {
        let mut arr: Array<felt252> = ArrayTrait::new();
        Serde::<T>::serialize(@value, ref arr);

        StorageAccess::<felt252>::write(address_domain, base, arr.len().into());

        _write(:address_domain, :base, value: arr, index: 0_u8)
    }
}

fn _read(
    address_domain: u32, base: StorageBaseAddress, size: usize, index: u8, ref acc: Array<felt252>
) {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if index.into() == size {
        return ();
    }

    let value = storage_read_syscall(
        address_domain, storage_address_from_base_and_offset(base, index + 1_u8)
    )
        .expect('StorageAccessArray - non felt');

    acc.append(value);

    _read(:address_domain, :base, :size, index: index + 1_u8, ref :acc)
}

fn _write(
    address_domain: u32, base: StorageBaseAddress, value: Array<felt252>, index: u8
) -> SyscallResult<()> {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if index.into() == value.len() {
        return Result::Ok(());
    }

    storage_write_syscall(
        address_domain,
        storage_address_from_base_and_offset(base, index + 1_u8),
        *value[index.into()]
    );

    _write(:address_domain, :base, :value, index: index + 1_u8)
}
