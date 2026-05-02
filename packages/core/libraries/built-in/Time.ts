import { createLibrary } from "@core/runtime/built-in/lib_factory";
import { simple } from "@core/runtime/built-in/func_builder";
import {
  MK_NULL,
  type FunctionCall,
  MK_NUMBER,
  type NumberValue,
  type ObjectValue,
  MK_OBJECT,
  MK_CUSTOM,
  MK_STRING,
  RuntimeValue,
  MK_PROMISE,
} from "@core/runtime/values";
import { registerCustomType } from "@core/runtime/custom_types";

const sleep: FunctionCall = simple(["number"], (a, _env, _line, _column) => {
  const ms = Number(a.value) || 0;
  if (ms <= 0) return MK_NULL();

  // Try to use Atomics.wait on a SharedArrayBuffer if available (efficient blocking)
  try {
    if (
      typeof Atomics !== "undefined" &&
      typeof SharedArrayBuffer !== "undefined"
    ) {
      const sab = new SharedArrayBuffer(4);
      const ia = new Int32Array(sab);
      // Atomics.wait blocks the current thread for up to ms milliseconds
      // In Node.js this will block the event loop thread (intended behavior for sleep)
      Atomics.wait(ia, 0, 0, ms);
      return MK_NULL();
    }
  } catch (e) {
    // fallback below
  }

  // Fallback: busy-wait (not ideal but portable)
  const start = Date.now();
  while (Date.now() - start < ms) {
    // spin
  }

  return MK_NULL();
});

const now: FunctionCall = simple([], () => {
  return MK_NUMBER(Date.now());
});

const sleepAsync: FunctionCall = simple(["number"], (a) => {
  const ms = Number(a.value) || 0;
  if (ms <= 0) return MK_PROMISE(Promise.resolve(MK_NULL()));
  return MK_PROMISE(
    new Promise<RuntimeValue>((resolve) =>
      setTimeout(() => resolve(MK_NULL()), ms),
    ),
  );
});

const today: FunctionCall = simple([], () => {
  const date = new Date();

  const obj = MK_OBJECT(
    new Map<string, NumberValue>([
      ["year", { type: "number", value: date.getFullYear() }],
      ["month", { type: "number", value: date.getMonth() + 1 }], // Months are 0-indexed in JS
      ["day", { type: "number", value: date.getDate() }],
      ["hour", { type: "number", value: date.getHours() }],
      ["minute", { type: "number", value: date.getMinutes() }],
      ["second", { type: "number", value: date.getSeconds() }],
      ["millisecond", { type: "number", value: date.getMilliseconds() }],
    ]),
  );

  return MK_CUSTOM("Date", obj);
});

// Register a Date custom type descriptor with getters, setters and methods
registerCustomType("Date", {
  isMutable: true,
  getters: {
    year: (cv) =>
      (cv.value as ObjectValue).properties.get("year") ?? MK_NUMBER(0),
    month: (cv) =>
      (cv.value as ObjectValue).properties.get("month") ?? MK_NUMBER(1),
    day: (cv) =>
      (cv.value as ObjectValue).properties.get("day") ?? MK_NUMBER(1),
    hour: (cv) =>
      (cv.value as ObjectValue).properties.get("hour") ?? MK_NUMBER(0),
    minute: (cv) =>
      (cv.value as ObjectValue).properties.get("minute") ?? MK_NUMBER(0),
    second: (cv) =>
      (cv.value as ObjectValue).properties.get("second") ?? MK_NUMBER(0),
    millisecond: (cv) =>
      (cv.value as ObjectValue).properties.get("millisecond") ?? MK_NUMBER(0),
  },
  setters: {
    year: (cv, v) => {
      (cv.value as ObjectValue).properties.set("year", v);
      return v;
    },
    month: (cv, v) => {
      (cv.value as ObjectValue).properties.set("month", v);
      return v;
    },
    day: (cv, v) => {
      (cv.value as ObjectValue).properties.set("day", v);
      return v;
    },
    hour: (cv, v) => {
      (cv.value as ObjectValue).properties.set("hour", v);
      return v;
    },
    minute: (cv, v) => {
      (cv.value as ObjectValue).properties.set("minute", v);
      return v;
    },
    second: (cv, v) => {
      (cv.value as ObjectValue).properties.set("second", v);
      return v;
    },
    millisecond: (cv, v) => {
      (cv.value as ObjectValue).properties.set("millisecond", v);
      return v;
    },
  },
  methods: {
    toISO: (cv) => {
      const obj = cv.value as ObjectValue;
      const y = obj.properties.get("year")?.value ?? 0;
      const m = obj.properties.get("month")?.value ?? 1;
      const d = obj.properties.get("day")?.value ?? 1;
      const iso = `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      return MK_STRING(iso);
    },
  },
  toString: (cv) => {
    const obj = cv.value as ObjectValue;
    const y = obj.properties.get("year")?.value ?? 0;
    const m = obj.properties.get("month")?.value ?? 1;
    const d = obj.properties.get("day")?.value ?? 1;
    const h = obj.properties.get("hour")?.value ?? 0;
    const min = obj.properties.get("minute")?.value ?? 0;
    const s = obj.properties.get("second")?.value ?? 0;
    const ms = obj.properties.get("millisecond")?.value ?? 0;
    return (
      "<Date " +
      `${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}-${String(y).padStart(4, "0")}` +
      `T${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}` +
      ">"
    );
  },
  // factory: can create a Date from (year, month, day) or from ISO string
  factory: (args) => {
    let dateObj = new Date();
    if (
      args.length >= 3 &&
      args[0].type === "number" &&
      args[1].type === "number" &&
      args[2].type === "number"
    ) {
      dateObj = new Date(args[0].value, args[1].value - 1, args[2].value);
    } else if (args.length === 1 && args[0].type === "string") {
      dateObj = new Date(args[0].value);
    }

    const obj = MK_OBJECT(
      new Map<string, NumberValue>([
        ["year", { type: "number", value: dateObj.getFullYear() }],
        ["month", { type: "number", value: dateObj.getMonth() + 1 }],
        ["day", { type: "number", value: dateObj.getDate() }],
        ["hour", { type: "number", value: dateObj.getHours() }],
        ["minute", { type: "number", value: dateObj.getMinutes() }],
        ["second", { type: "number", value: dateObj.getSeconds() }],
        ["millisecond", { type: "number", value: dateObj.getMilliseconds() }],
      ]),
    );

    return MK_CUSTOM("Date", obj);
  },
  equals: (a, b) => {
    const ao = a.value as ObjectValue;
    const bo = b.value as ObjectValue;
    const keys = [
      "year",
      "month",
      "day",
      "hour",
      "minute",
      "second",
      "millisecond",
    ];
    for (const k of keys) {
      const av = ao.properties.get(k)?.value ?? null;
      const bv = bo.properties.get(k)?.value ?? null;
      if (av !== bv) return false;
    }
    return true;
  },
  toJSON: (cv) => {
    // return backing object so JSON.stringify will serialize properly
    return cv.value as ObjectValue;
  },
  clone: (cv) => {
    const obj = cv.value as ObjectValue;
    const props = new Map<string, RuntimeValue>();
    for (const [k, v] of obj.properties.entries()) props.set(k, v);
    return MK_CUSTOM("Date", MK_OBJECT(props));
  },
});

const DateFn: FunctionCall = simple(
  [
    { type: "number", optional: true },
    { type: "number", optional: true },
    { type: "number", optional: true },
    { type: "number", optional: true },
    { type: "number", optional: true },
    { type: "number", optional: true },
    { type: "number", optional: true },
  ],
  (
    d: NumberValue,
    m: NumberValue,
    y: NumberValue,
    h: NumberValue,
    mi: NumberValue,
    s: NumberValue,
    ms: NumberValue,
  ) => {
    let dateObj: Date;

    if (d.value && m.value && y.value) {
      dateObj = new Date(
        y.value,
        m.value - 1,
        d.value,
        h.value || 0,
        mi.value || 0,
        s.value || 0,
        ms.value || 0,
      );
    } else if (d.value && !m.value && !y.value) {
      dateObj = new Date(d.value);
    } else if (!d.value && !m.value && !y.value) {
      dateObj = new Date();
    } else {
      throw new Error(
        "Invalid arguments for Date constructor. Expected either (year, month, day) or (isoString) or no arguments.",
      );
    }

    const obj = MK_OBJECT(
      new Map<string, NumberValue>([
        ["year", { type: "number", value: dateObj.getFullYear() }],
        ["month", { type: "number", value: dateObj.getMonth() + 1 }],
        ["day", { type: "number", value: dateObj.getDate() }],
        ["hour", { type: "number", value: dateObj.getHours() }],
        ["minute", { type: "number", value: dateObj.getMinutes() }],
        ["second", { type: "number", value: dateObj.getSeconds() }],
        ["millisecond", { type: "number", value: dateObj.getMilliseconds() }],
      ]),
    );

    return MK_CUSTOM("Date", obj);
  },
);

export default createLibrary(
  "Time",
  { sleep, sleepAsync, now, today, Date: DateFn },
  {},
);
