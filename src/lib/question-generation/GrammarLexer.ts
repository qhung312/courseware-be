// Generated from Grammar.g4 by ANTLR 4.13.0
// noinspection ES6UnusedImports,JSUnusedGlobalSymbols,JSUnusedLocalSymbols
import {
    ATN,
    ATNDeserializer,
    CharStream,
    DecisionState,
    DFA,
    Lexer,
    LexerATNSimulator,
    RuleContext,
    PredictionContextCache,
    Token,
} from "antlr4";
export default class GrammarLexer extends Lexer {
    public static readonly T__0 = 1;
    public static readonly T__1 = 2;
    public static readonly T__2 = 3;
    public static readonly T__3 = 4;
    public static readonly BOOLEAN = 5;
    public static readonly ID = 6;
    public static readonly WS = 7;
    public static readonly NUM = 8;
    public static readonly COMMA = 9;
    public static readonly LPAREN = 10;
    public static readonly RPAREN = 11;
    public static readonly EQUAL = 12;
    public static readonly GREATER = 13;
    public static readonly LESS = 14;
    public static readonly AMPERSAND = 15;
    public static readonly PIPE = 16;
    public static readonly STRING = 17;
    public static readonly EXCLAM = 18;
    public static readonly NL = 19;
    public static readonly ASTERISK = 20;
    public static readonly SLASH = 21;
    public static readonly PERCENT = 22;
    public static readonly PLUS = 23;
    public static readonly MINUS = 24;
    public static readonly EOF = Token.EOF;

    public static readonly channelNames: string[] = [
        "DEFAULT_TOKEN_CHANNEL",
        "HIDDEN",
    ];
    public static readonly literalNames: (string | null)[] = [
        null,
        "'if'",
        "'else'",
        "'{'",
        "'}'",
        null,
        null,
        null,
        null,
        "','",
        "'('",
        "')'",
        "'='",
        "'>'",
        "'<'",
        "'&'",
        "'|'",
        null,
        "'!'",
        "'\\n'",
        "'*'",
        "'/'",
        "'%'",
        "'+'",
        "'-'",
    ];
    public static readonly symbolicNames: (string | null)[] = [
        null,
        null,
        null,
        null,
        null,
        "BOOLEAN",
        "ID",
        "WS",
        "NUM",
        "COMMA",
        "LPAREN",
        "RPAREN",
        "EQUAL",
        "GREATER",
        "LESS",
        "AMPERSAND",
        "PIPE",
        "STRING",
        "EXCLAM",
        "NL",
        "ASTERISK",
        "SLASH",
        "PERCENT",
        "PLUS",
        "MINUS",
    ];
    public static readonly modeNames: string[] = ["DEFAULT_MODE"];

    public static readonly ruleNames: string[] = [
        "T__0",
        "T__1",
        "T__2",
        "T__3",
        "BOOLEAN",
        "ID",
        "WS",
        "NUM",
        "COMMA",
        "LPAREN",
        "RPAREN",
        "EQUAL",
        "GREATER",
        "LESS",
        "AMPERSAND",
        "PIPE",
        "STRING",
        "EXCLAM",
        "NL",
        "ASTERISK",
        "SLASH",
        "PERCENT",
        "PLUS",
        "MINUS",
    ];

    constructor(input: CharStream) {
        super(input);
        this._interp = new LexerATNSimulator(
            this,
            GrammarLexer._ATN,
            GrammarLexer.DecisionsToDFA,
            new PredictionContextCache()
        );
    }

    public get grammarFileName(): string {
        return "Grammar.g4";
    }

    public get literalNames(): (string | null)[] {
        return GrammarLexer.literalNames;
    }
    public get symbolicNames(): (string | null)[] {
        return GrammarLexer.symbolicNames;
    }
    public get ruleNames(): string[] {
        return GrammarLexer.ruleNames;
    }

    public get serializedATN(): number[] {
        return GrammarLexer._serializedATN;
    }

    public get channelNames(): string[] {
        return GrammarLexer.channelNames;
    }

    public get modeNames(): string[] {
        return GrammarLexer.modeNames;
    }

    public static readonly _serializedATN: number[] = [
        4, 0, 24, 147, 6, -1, 2, 0, 7, 0, 2, 1, 7, 1, 2, 2, 7, 2, 2, 3, 7, 3, 2,
        4, 7, 4, 2, 5, 7, 5, 2, 6, 7, 6, 2, 7, 7, 7, 2, 8, 7, 8, 2, 9, 7, 9, 2,
        10, 7, 10, 2, 11, 7, 11, 2, 12, 7, 12, 2, 13, 7, 13, 2, 14, 7, 14, 2,
        15, 7, 15, 2, 16, 7, 16, 2, 17, 7, 17, 2, 18, 7, 18, 2, 19, 7, 19, 2,
        20, 7, 20, 2, 21, 7, 21, 2, 22, 7, 22, 2, 23, 7, 23, 1, 0, 1, 0, 1, 0,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 3, 1, 3, 1, 4, 1, 4, 1, 4,
        1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 1, 4, 3, 4, 71, 8, 4, 1, 5, 1, 5, 5, 5,
        75, 8, 5, 10, 5, 12, 5, 78, 9, 5, 1, 6, 4, 6, 81, 8, 6, 11, 6, 12, 6,
        82, 1, 6, 1, 6, 1, 7, 4, 7, 88, 8, 7, 11, 7, 12, 7, 89, 1, 7, 1, 7, 4,
        7, 94, 8, 7, 11, 7, 12, 7, 95, 3, 7, 98, 8, 7, 1, 8, 1, 8, 1, 9, 1, 9,
        1, 10, 1, 10, 1, 11, 1, 11, 1, 12, 1, 12, 1, 13, 1, 13, 1, 14, 1, 14, 1,
        15, 1, 15, 1, 16, 1, 16, 5, 16, 118, 8, 16, 10, 16, 12, 16, 121, 9, 16,
        1, 16, 1, 16, 1, 16, 5, 16, 126, 8, 16, 10, 16, 12, 16, 129, 9, 16, 1,
        16, 3, 16, 132, 8, 16, 1, 17, 1, 17, 1, 18, 1, 18, 1, 19, 1, 19, 1, 20,
        1, 20, 1, 21, 1, 21, 1, 22, 1, 22, 1, 23, 1, 23, 0, 0, 24, 1, 1, 3, 2,
        5, 3, 7, 4, 9, 5, 11, 6, 13, 7, 15, 8, 17, 9, 19, 10, 21, 11, 23, 12,
        25, 13, 27, 14, 29, 15, 31, 16, 33, 17, 35, 18, 37, 19, 39, 20, 41, 21,
        43, 22, 45, 23, 47, 24, 1, 0, 6, 3, 0, 65, 90, 95, 95, 97, 122, 4, 0,
        48, 57, 65, 90, 95, 95, 97, 122, 3, 0, 9, 10, 12, 13, 32, 32, 1, 0, 48,
        57, 1, 0, 34, 34, 1, 0, 39, 39, 155, 0, 1, 1, 0, 0, 0, 0, 3, 1, 0, 0, 0,
        0, 5, 1, 0, 0, 0, 0, 7, 1, 0, 0, 0, 0, 9, 1, 0, 0, 0, 0, 11, 1, 0, 0, 0,
        0, 13, 1, 0, 0, 0, 0, 15, 1, 0, 0, 0, 0, 17, 1, 0, 0, 0, 0, 19, 1, 0, 0,
        0, 0, 21, 1, 0, 0, 0, 0, 23, 1, 0, 0, 0, 0, 25, 1, 0, 0, 0, 0, 27, 1, 0,
        0, 0, 0, 29, 1, 0, 0, 0, 0, 31, 1, 0, 0, 0, 0, 33, 1, 0, 0, 0, 0, 35, 1,
        0, 0, 0, 0, 37, 1, 0, 0, 0, 0, 39, 1, 0, 0, 0, 0, 41, 1, 0, 0, 0, 0, 43,
        1, 0, 0, 0, 0, 45, 1, 0, 0, 0, 0, 47, 1, 0, 0, 0, 1, 49, 1, 0, 0, 0, 3,
        52, 1, 0, 0, 0, 5, 57, 1, 0, 0, 0, 7, 59, 1, 0, 0, 0, 9, 70, 1, 0, 0, 0,
        11, 72, 1, 0, 0, 0, 13, 80, 1, 0, 0, 0, 15, 87, 1, 0, 0, 0, 17, 99, 1,
        0, 0, 0, 19, 101, 1, 0, 0, 0, 21, 103, 1, 0, 0, 0, 23, 105, 1, 0, 0, 0,
        25, 107, 1, 0, 0, 0, 27, 109, 1, 0, 0, 0, 29, 111, 1, 0, 0, 0, 31, 113,
        1, 0, 0, 0, 33, 131, 1, 0, 0, 0, 35, 133, 1, 0, 0, 0, 37, 135, 1, 0, 0,
        0, 39, 137, 1, 0, 0, 0, 41, 139, 1, 0, 0, 0, 43, 141, 1, 0, 0, 0, 45,
        143, 1, 0, 0, 0, 47, 145, 1, 0, 0, 0, 49, 50, 5, 105, 0, 0, 50, 51, 5,
        102, 0, 0, 51, 2, 1, 0, 0, 0, 52, 53, 5, 101, 0, 0, 53, 54, 5, 108, 0,
        0, 54, 55, 5, 115, 0, 0, 55, 56, 5, 101, 0, 0, 56, 4, 1, 0, 0, 0, 57,
        58, 5, 123, 0, 0, 58, 6, 1, 0, 0, 0, 59, 60, 5, 125, 0, 0, 60, 8, 1, 0,
        0, 0, 61, 62, 5, 116, 0, 0, 62, 63, 5, 114, 0, 0, 63, 64, 5, 117, 0, 0,
        64, 71, 5, 101, 0, 0, 65, 66, 5, 102, 0, 0, 66, 67, 5, 97, 0, 0, 67, 68,
        5, 108, 0, 0, 68, 69, 5, 115, 0, 0, 69, 71, 5, 101, 0, 0, 70, 61, 1, 0,
        0, 0, 70, 65, 1, 0, 0, 0, 71, 10, 1, 0, 0, 0, 72, 76, 7, 0, 0, 0, 73,
        75, 7, 1, 0, 0, 74, 73, 1, 0, 0, 0, 75, 78, 1, 0, 0, 0, 76, 74, 1, 0, 0,
        0, 76, 77, 1, 0, 0, 0, 77, 12, 1, 0, 0, 0, 78, 76, 1, 0, 0, 0, 79, 81,
        7, 2, 0, 0, 80, 79, 1, 0, 0, 0, 81, 82, 1, 0, 0, 0, 82, 80, 1, 0, 0, 0,
        82, 83, 1, 0, 0, 0, 83, 84, 1, 0, 0, 0, 84, 85, 6, 6, 0, 0, 85, 14, 1,
        0, 0, 0, 86, 88, 7, 3, 0, 0, 87, 86, 1, 0, 0, 0, 88, 89, 1, 0, 0, 0, 89,
        87, 1, 0, 0, 0, 89, 90, 1, 0, 0, 0, 90, 97, 1, 0, 0, 0, 91, 93, 5, 46,
        0, 0, 92, 94, 7, 3, 0, 0, 93, 92, 1, 0, 0, 0, 94, 95, 1, 0, 0, 0, 95,
        93, 1, 0, 0, 0, 95, 96, 1, 0, 0, 0, 96, 98, 1, 0, 0, 0, 97, 91, 1, 0, 0,
        0, 97, 98, 1, 0, 0, 0, 98, 16, 1, 0, 0, 0, 99, 100, 5, 44, 0, 0, 100,
        18, 1, 0, 0, 0, 101, 102, 5, 40, 0, 0, 102, 20, 1, 0, 0, 0, 103, 104, 5,
        41, 0, 0, 104, 22, 1, 0, 0, 0, 105, 106, 5, 61, 0, 0, 106, 24, 1, 0, 0,
        0, 107, 108, 5, 62, 0, 0, 108, 26, 1, 0, 0, 0, 109, 110, 5, 60, 0, 0,
        110, 28, 1, 0, 0, 0, 111, 112, 5, 38, 0, 0, 112, 30, 1, 0, 0, 0, 113,
        114, 5, 124, 0, 0, 114, 32, 1, 0, 0, 0, 115, 119, 5, 34, 0, 0, 116, 118,
        8, 4, 0, 0, 117, 116, 1, 0, 0, 0, 118, 121, 1, 0, 0, 0, 119, 117, 1, 0,
        0, 0, 119, 120, 1, 0, 0, 0, 120, 122, 1, 0, 0, 0, 121, 119, 1, 0, 0, 0,
        122, 132, 5, 34, 0, 0, 123, 127, 5, 39, 0, 0, 124, 126, 8, 5, 0, 0, 125,
        124, 1, 0, 0, 0, 126, 129, 1, 0, 0, 0, 127, 125, 1, 0, 0, 0, 127, 128,
        1, 0, 0, 0, 128, 130, 1, 0, 0, 0, 129, 127, 1, 0, 0, 0, 130, 132, 5, 39,
        0, 0, 131, 115, 1, 0, 0, 0, 131, 123, 1, 0, 0, 0, 132, 34, 1, 0, 0, 0,
        133, 134, 5, 33, 0, 0, 134, 36, 1, 0, 0, 0, 135, 136, 5, 10, 0, 0, 136,
        38, 1, 0, 0, 0, 137, 138, 5, 42, 0, 0, 138, 40, 1, 0, 0, 0, 139, 140, 5,
        47, 0, 0, 140, 42, 1, 0, 0, 0, 141, 142, 5, 37, 0, 0, 142, 44, 1, 0, 0,
        0, 143, 144, 5, 43, 0, 0, 144, 46, 1, 0, 0, 0, 145, 146, 5, 45, 0, 0,
        146, 48, 1, 0, 0, 0, 10, 0, 70, 76, 82, 89, 95, 97, 119, 127, 131, 1, 6,
        0, 0,
    ];

    private static __ATN: ATN;
    public static get _ATN(): ATN {
        if (!GrammarLexer.__ATN) {
            GrammarLexer.__ATN = new ATNDeserializer().deserialize(
                GrammarLexer._serializedATN
            );
        }

        return GrammarLexer.__ATN;
    }

    static DecisionsToDFA = GrammarLexer._ATN.decisionToState.map(
        (ds: DecisionState, index: number) => new DFA(ds, index)
    );
}
