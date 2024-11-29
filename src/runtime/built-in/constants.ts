import { MK_BOOL, MK_NULL } from "../values.ts";

// List of all the constants which are built-in in the 'gh3sp' language
export const built_in_constants = [
    {
        name: "true",
        value: MK_BOOL(true),
    },
    {
        name: "false",
        value: MK_BOOL(false),
    },
    {
        name: "null",
        value: MK_NULL(),
    },
];
