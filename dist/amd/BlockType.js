define(["require", "exports"], function(require, exports) {
    var BlockType;
    (function (BlockType) {
        BlockType[BlockType["Element"] = 0] = "Element";
        BlockType[BlockType["Text"] = 1] = "Text";
        BlockType[BlockType["Comment"] = 2] = "Comment";
        BlockType[BlockType["Block"] = 3] = "Block";
        BlockType[BlockType["IfBlock"] = 4] = "IfBlock";
        BlockType[BlockType["RepeaterBlock"] = 5] = "RepeaterBlock";
        BlockType[BlockType["View"] = 6] = "View";
    })(BlockType || (BlockType = {}));

    
    return BlockType;
});
