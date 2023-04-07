use debug::PrintTrait;

use integer::u32_to_felt252;
use integer::u128_to_felt252;
use array::ArrayTrait;

use redstone::protocol::DataPoint;
use redstone::protocol::DataPackage;
use redstone::protocol::Payload;
use redstone::protocol::Signature;
use redstone::number_convertible_array::NumberConvertibleArrayTrait;
use redstone::gas::out_of_gas_array;

impl DataPointPrintImpl of PrintTrait<DataPoint> {
    fn print(self: DataPoint) {
        'DataPoint --> feed_id'.print();
        self.feed_id.print();
        'DataPoint --> value'.print();
        self.value.print();
    }
}

impl DataPackagePrintImpl of PrintTrait<DataPackage> {
    fn print(self: DataPackage) {
        'DataPackage --> timestamp'.print();
        self.timestamp.print();
        'DataPackage --> data_points'.print();
        self.data_points.print();
        'DataPackage --> signature'.print();
        self.signature.print();
    }
}

impl PayloadPrintImpl of PrintTrait<Payload> {
    fn print(self: Payload) {
        'Payload --> data_packages'.print();
        self.data_packages.print();
    }
}

impl SignaturePrintImpl of PrintTrait<Signature> {
    fn print(self: Signature) {
        'Signature --> r'.print();
        self.r_bytes.to_u256().high.print();
        self.r_bytes.to_u256().low.print();
        'Signature --> s'.print();
        self.s_bytes.to_u256().high.print();
        self.s_bytes.to_u256().low.print();
        'Signature --> v'.print();
        self.v.print();
    }
}

impl ValuesPrint<T,
impl TPrint: PrintTrait<T>,
impl TCopy: Copy<T>> of PrintTrait<Array<@Array<T>>> {
    fn print(self: Array<@Array<T>>) {
        print_index(@self, 0_usize);
    }
}

impl OptionPrintImpl<T, impl TPrint: PrintTrait<T>> of PrintTrait<Option<T>> {
    fn print(self: Option<T>) {
        match self {
            Option::Some(x) => x.print(),
            Option::None(()) => 'None'.print(),
        }
    }
}

impl GenericArrayPrintImpl<T,
impl TPrint: PrintTrait<T>,
impl TCopy: Copy<T>> of PrintTrait<@Array<T>> {
    fn print(self: @Array<T>) {
        print_index(self, 0_usize);
    }
}

fn print_index<T, impl TPrint: PrintTrait<T>, impl TCopy: Copy<T>>(self: @Array<T>, index: usize) {
    match gas::withdraw_gas_all(get_builtin_costs()) {
        Option::Some(_) => {},
        Option::None(_) => panic(out_of_gas_array()),
    };

    if (index == self.len()) {
        return ();
    }

    'Array --> index'.print();
    u32_to_felt252(index).print();
    let elt: T = *self[index];
    elt.print();
    print_index(self, index + 1_usize);
}
