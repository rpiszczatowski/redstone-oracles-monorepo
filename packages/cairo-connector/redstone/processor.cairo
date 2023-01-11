from starkware.cairo.common.cairo_builtins import BitwiseBuiltin, HashBuiltin
from starkware.cairo.common.math import assert_nn

from redstone.crypto.secp import recover_address
from redstone.crypto.signature import Signature

from redstone.protocol.payload import Payload, get_payload
from redstone.protocol.data_package import DataPackageArray

from redstone.utils.array import Array, array_index

struct Config {
    allowed_signer_addresses: Array,
}

func process_payload{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
    data_ptr: felt*, data_length: felt, config: Config
) -> Payload {
    alloc_locals;

    assert_nn(data_length);

    local payload_arr: Array = Array(ptr=data_ptr, len=data_length);
    let payload = get_payload(bytes_arr=payload_arr);

    verify_data_packages(arr=payload.data_packages, index=0, config=config);

    return payload;
}

func verify_data_packages{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
    arr: DataPackageArray, index: felt, config: Config
) {
    if (index == arr.len) {
        return ();
    }

    let package = arr.ptr[index];

    verify_signature(signable_arr=package.signable_arr, signature=package.signature, config=config);

    return verify_data_packages(arr=arr, index=index + 1, config=config);
}

func verify_signature{range_check_ptr, bitwise_ptr: BitwiseBuiltin*}(
    signable_arr: Array, signature: Signature, config: Config
) {
    alloc_locals;

    let address = recover_address(signable_arr=signable_arr, signature=signature);
    let signer_index = array_index(arr=config.allowed_signer_addresses, key=address);

    local addr = address;

    with_attr error_message("signer_index must be nonnegative (address={addr})") {
        assert_nn(signer_index);
    }

    return ();
}
