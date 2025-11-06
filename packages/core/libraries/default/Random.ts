import { MK_NUMBER, RuntimeValue, type FunctionCall } from "@core/runtime/values.ts";
import { handleError } from "@core/utils/errors_handler.ts";


function makeRandomNumber(min: number, max: number, precision: number = 1): number {
    return Math.floor(Math.random() * (1 + max * precision - min * precision) + min * precision) / precision
}

const rand: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 2 && args.length != 3) throw handleError(new SyntaxError("Invalid number of arguments. Expected '2|3' argument but received " + args.length), line, column);
    if (args[0].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number' but received " + args[0].type), line, column);
    if (args[1].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number' but received " + args[1].type), line, column);
    if (args.length == 3)if (args[2].type != "number") throw handleError(new SyntaxError("Invalid argument type. Expected 'number' but received " + args[2].type), line, column);
    
    const min = args[0].value;
    const max = args[1].value;
    
    let precision: number;
    if (args.length == 3) precision = 10**(args[2].value)
    else {
        if (countDecimalPlaces(max) > countDecimalPlaces(min)) precision = 10**countDecimalPlaces(max)
        else precision = 10**countDecimalPlaces(min)
    }
    
    if (min > max) throw handleError(new SyntaxError("Invalid arguments. 'min' argument must be less than or equal to 'max' argument."), line, column);

    return MK_NUMBER(makeRandomNumber(min, max, precision));
}

function countDecimalPlaces(num: number): number {
    // Converti il numero in stringa
    const numStr = num.toString();

    // Verifica se contiene un punto decimale
    if (numStr.includes(".")) {
        // Restituisce il conteggio delle cifre dopo il punto decimale
        return numStr.split(".")[1].length;
    } else {
        // Se non ci sono decimali, restituisce 0
        return 0;
    }
}


const choose: FunctionCall = (args: RuntimeValue[], line: number, column: number) => {
    if (args.length != 1) throw handleError(new SyntaxError("Invalid number of arguments. Expected '1' argument but received " + args.length), line, column);
    if (args[0].type != "list") throw handleError(new SyntaxError("Invalid argument type. Expected 'list' but received " + args[0].type), line, column);

    return args[0].value[makeRandomNumber(0, (args[0].value).length - 1)];
}

export default {
    Random:{
        functions: {
            rand,
            choose
        },
        constants: {
            number: MK_NUMBER(makeRandomNumber(0, 1)),
        },
    }
};
