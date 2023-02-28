library crypto;

dep bytes;

use std::{
    b256::*,
    b512::*,
    bytes::*,
    ecr::{
        ec_recover,
        EcRecoverError,
    },
    hash::keccak256,
    logging::log,
};
use bytes::*;

pub fn recover_signer_address(signature_bytes: Bytes, signable_bytes: Bytes) -> Address {
    let (r_bytes, mut s_bytes) = signature_bytes.slice_tail_offset(32, 1);
    let v = signature_bytes.get(signature_bytes.len - 1).unwrap();
    let r_number = b256::try_from(r_bytes).unwrap();
    let s_number = b256::try_from(s_bytes).unwrap();

    let hash = signable_bytes.keccak256();

    return recover_public_address(r_number, s_number, v, hash).unwrap();
}

fn recover_public_address(
    r: b256,
    s: b256,
    v: u64,
    msg_hash: b256,
) -> Result<Address, EcRecoverError> {
    let mut v_256: b256 = 0x0000000000000000000000000000000000000000000000000000000000000000;
    if (v == 28) {
        v_256 = 0x0000000000000000000000000000000000000000000000000000000000000001;
    }

    let mut s_with_parity = s | (v_256 << 255);

    let signature = B512 {
        bytes: [r, s_with_parity],
    };

    let pub_key_result = ec_recover(signature, msg_hash);
    if let Result::Err(e) = pub_key_result {
        // propagate the error if it exists
        Result::Err(e)
    } else {
        let pub_key = pub_key_result.unwrap();
        let address = keccak256(((pub_key.bytes)[0], (pub_key.bytes)[1]));
        let mask = 0x000000000000000000000000FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

        Result::Ok(Address::from(address & mask))
    }
}

#[test]
fn test_recover_signer_address_v27() {
    // 77 bytes are splitted by 3 parts, the first one consists of 3 bytes, the last one consists of 18 bytes + 14 bytes of zero-bytes, so we have 77-(3+18+14) = 42 zero-bytes inside:
    // 0x45544800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002603c77cf6018697ef555000000020000001
    // signature: 0x54bc55649dbae70cbf6279bc68485dfdd3d4915e0baae54e252af69f4c012faf34465a4d835255391ddfd36736b6d8dcd3fbb0ff5798419ea8c287936680bfc31b
    let initial = [0x45, 0x54, 0x48];
    let number_of_mid_zeroes = 42;
    let number_low = 0x00000000000000000000000000002603c77cf6018697ef555000000020000001;

    let r = 0x54bc55649dbae70cbf6279bc68485dfdd3d4915e0baae54e252af69f4c012faf;
    let s = 0x34465a4d835255391ddfd36736b6d8dcd3fbb0ff5798419ea8c287936680bfc3;
    let v = 0x1b;

    let signer_address = 0x00000000000000000000000012470f7aBA85c8b81D63137DD5925D6EE114952b;

    let result = recover_signer_address(signature_bytes(r, s, v), signable_bytes(initial, number_of_mid_zeroes, number_low));

    assert(signer_address == result.value);
}

#[test]
fn test_recover_signer_address_v28() {
    // 77 bytes are splitted by 3 parts, the first one consists of 3 bytes, the last one consists of 18 bytes + 14 bytes of zero-bytes, so we have 77-(3+18+14) = 42 zero-bytes inside:
    // 0x4554480000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000261b2eceac01869816da8000000020000001
    // signature: 0xacafa79c353f3641e653d22b34e432d8b110eea51196bac884690200c0def9ac672de77dbacde8ecff23e1976ee738eec9ad0a75933c6b9b52efa8dfa614fe5e1c
    let initial = [0x45, 0x54, 0x48];
    let number_of_mid_zeroes = 42;
    let number_low = 0x0000000000000000000000000000261b2eceac01869816da8000000020000001;

    let r = 0xacafa79c353f3641e653d22b34e432d8b110eea51196bac884690200c0def9ac;
    let s = 0x672de77dbacde8ecff23e1976ee738eec9ad0a75933c6b9b52efa8dfa614fe5e;
    let v = 0x1c;

    let signer_address = 0x00000000000000000000000012470f7aBA85c8b81D63137DD5925D6EE114952b;

    let result = recover_signer_address(signature_bytes(r, s, v), signable_bytes(initial, number_of_mid_zeroes, number_low));

    assert(signer_address == result.value);
}

fn signature_bytes(r: b256, s: b256, v: u8) -> Bytes {
    let mut signature_bytes = Bytes::from(r);
    signature_bytes.append(Bytes::from(s));
    signature_bytes.push(v);

    return signature_bytes;
}

fn signable_bytes(initial: [u8; 3], number_of_mid_zeroes: u8, number_low: b256) -> Bytes {
    let mut signable_bytes = Bytes::new();
    signable_bytes.push(initial[0]);
    signable_bytes.push(initial[1]);
    signable_bytes.push(initial[2]);

    let mut i = 0;
    while (i < number_of_mid_zeroes) {
        signable_bytes.push(0x00);
        i += 1;
    }

    signable_bytes.append(Bytes::from(number_low));

    return signable_bytes;
}
