import {
  JsNativeRedstoneNumber,
  JsNativeRedstoneNumberConfig,
} from "../../src/numbers/JsNativeRedstoneNumber";
import { NumberArg } from "../../src/numbers/RedstoneNumber";

describe("JsNativePreciseNumber", () => {
  describe("constructor", () => {
    it.each([
      ["0", 0],
      ["1", 1],
      ["123.123", 123.123],
      [0, 0],
      [-0, -0],
      ["-123.123", -123.123],
      ["-12", -12],
      [1, 1],
      [123.123, 123.123],
      ["0x01", /Invalid number format/],
      ["0.", /Invalid number format/],
      ["0.1.2", /Invalid number format/],
      [".1", /Invalid number format/],
      ["1,1", /Invalid number format/],
      ["1e1", /Invalid number format/],
      ["1e20", /Invalid number format/],
      ["00000000000000000000000000000000000000000000000001", 1],
      ["0000000000000000000000000000000000000000000000000.1", 0.1],
      [`${"0".repeat(100)}.1`, 0.1],
      [Number(), 0],
      [undefined as unknown as NumberArg, /Invalid number format/],
      [null as unknown as NumberArg, /Invalid number format/],
      [NaN, /Invalid number format/],
      [Infinity, /Invalid number format/],
      [+Infinity, /Invalid number format/],
      [-Infinity, /Invalid number format/],
      [
        JsNativeRedstoneNumberConfig.MIN_NUMBER / 10000,
        /Invalid number format/,
      ],
      [
        JsNativeRedstoneNumberConfig.MIN_NUMBER * -1,
        -JsNativeRedstoneNumberConfig.MIN_NUMBER,
      ],
      [
        JsNativeRedstoneNumberConfig.MIN_NUMBER,
        JsNativeRedstoneNumberConfig.MIN_NUMBER,
      ],
      [
        JsNativeRedstoneNumberConfig.MAX_NUMBER + 1,
        /Number is bigger then max number acceptable by REDSTONE/,
      ],
      // 8 decimals number
      ["1.12345678", 1.12345678],
      // 13 decimals number
      ["1.1234567812345", 1.1234567812345],
      // 14 decimals number
      ["1.12345678123456", 1.12345678123456],
      // 15 decimals number
      ["1.123456781234567", /Invalid number format/],
      // 32 decimals number
      ["1.12345678123456781234567812345678", /Invalid number format/],
      // 64 decimals number
      [
        "1.1234567812345678123456781234567812345678123456781234567812345678",
        /Invalid number format/,
      ],
      [JsNativeRedstoneNumberConfig.MIN_NUMBER / 2, /Invalid number format/],
      [JsNativeRedstoneNumberConfig.MIN_NUMBER / 2, /Invalid number format/],
      [JsNativeRedstoneNumberConfig.MIN_NUMBER * -0.5, /Invalid number format/],
    ])(
      "parse to JsNativePreciseNumber %s to %s",
      (value: NumberArg, expected: number | RegExp) => {
        if (typeof expected === "number") {
          expect(JsNativeRedstoneNumber.from(value).eq(expected)).toBe(true);
        } else {
          expect(() => JsNativeRedstoneNumber.from(value)).toThrowError(
            expected
          );
        }
      }
    );
  });

  describe("arithmetic operations", () => {
    describe("add", () => {
      it("should add floats (tricky 0.3)", () => {
        const result = JsNativeRedstoneNumber.from("100.131").add("100.123");
        expect(result.toString()).toBe("200.25400000000002"); // with this implementation we we
      });
      it("should add floats", () => {
        const result = JsNativeRedstoneNumber.from("120.132").add("0.122");
        expect(result.toString()).toBe("120.254");
      });
      it("should add  value < 0", () => {
        const result = JsNativeRedstoneNumber.from("120.132").add("-120");
        expect(result.eq("0.132")).toBe(true);
      });
      it("should add  two integers", () => {
        const result = JsNativeRedstoneNumber.from("120").add("-120");
        expect(result.toString()).toBe("0");
      });
      it("should add big integers", () => {
        const result = JsNativeRedstoneNumber.from(
          JsNativeRedstoneNumberConfig.MAX_NUMBER / 2
        ).add(JsNativeRedstoneNumberConfig.MAX_NUMBER / 2);
        expect(result.toString()).toBe(
          JsNativeRedstoneNumberConfig.MAX_NUMBER.toString()
        );
      });
      it("should throw on overflow", () => {
        expect(() =>
          JsNativeRedstoneNumber.from(
            JsNativeRedstoneNumberConfig.MAX_NUMBER / 2
          ).add(JsNativeRedstoneNumberConfig.MAX_NUMBER / 2 + 1)
        ).toThrowError();
      });
    });

    describe("sub", () => {
      it("should sub floats (tricky 0.3)", () => {
        const result = JsNativeRedstoneNumber.from("120.132").sub("0.123");
        expect(result.toString()).toBe("120.009");
      });
      it("should sub floats", () => {
        const result = JsNativeRedstoneNumber.from("120.132").sub("0.122");
        expect(result.toString()).toBe("120.01");
      });
      it("should sub value < 0", () => {
        const result = JsNativeRedstoneNumber.from("120.132").sub("-120");
        expect(result.toString()).toBe("240.132");
      });
      it("should sub two integers", () => {
        const result = JsNativeRedstoneNumber.from(`120.${"3".repeat(14)}`).sub(
          `120.${"3".repeat(14)}`
        );
        expect(result.toString()).toBe("0");
      });
      it("should sub big integers", () => {
        const result = JsNativeRedstoneNumber.from(
          JsNativeRedstoneNumberConfig.MAX_NUMBER / 2
        ).sub(JsNativeRedstoneNumberConfig.MAX_NUMBER / 2);
        expect(result.toString()).toBe("0");
      });
      it("should throw on overflow", () => {
        expect(() =>
          JsNativeRedstoneNumber.from(
            -JsNativeRedstoneNumberConfig.MAX_NUMBER / 2
          ).sub(JsNativeRedstoneNumberConfig.MAX_NUMBER)
        ).toThrowError();
      });
    });

    describe("mul", () => {
      it("should work for integers", () => {
        const result = JsNativeRedstoneNumber.from(10).mul(100);
        expect(result.toString()).toBe("1000");
      });

      it("should fail on overflow", () => {
        expect(() =>
          JsNativeRedstoneNumber.from(1.1).mul(
            JsNativeRedstoneNumberConfig.MAX_NUMBER
          )
        ).toThrowError();
      });

      it("should fail on underflow", () => {
        expect(() =>
          JsNativeRedstoneNumber.from(0.99).mul(
            JsNativeRedstoneNumberConfig.MIN_NUMBER
          )
        ).toThrowError();
      });

      it("should work big numbers", () => {
        expect(
          JsNativeRedstoneNumber.from(11)
            .mul(JsNativeRedstoneNumberConfig.MIN_NUMBER)
            .toString()
        ).toBe("1.1e-13");
      });
    });
    describe("div", () => {
      it("should work for integers", () => {
        const result = JsNativeRedstoneNumber.from(10).div(100);
        expect(result.toString()).toBe("0.1");
      });

      it("should fail on overflow", () => {
        expect(() =>
          JsNativeRedstoneNumber.from(1.1).div(
            JsNativeRedstoneNumberConfig.MAX_NUMBER
          )
        ).toThrowError();
      });

      it("should fail on underflow", () => {
        expect(() =>
          JsNativeRedstoneNumber.from(
            JsNativeRedstoneNumberConfig.MIN_NUMBER
          ).div(1.00001)
        ).toThrowError();
      });

      it("should work big numbers", () => {
        expect(
          JsNativeRedstoneNumber.from(1.1)
            .div(JsNativeRedstoneNumberConfig.MIN_NUMBER)
            .toString()
        ).toBe("110000000000000.02");
      });
    });
  });
});
