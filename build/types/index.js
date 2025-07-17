"use strict";
/**
 * @title Type Definitions
 * @author Arbitrage Bot System
 * @notice Tüm type tanımlamaları
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TridentPoolType = exports.CurvePoolType = exports.GasStrategy = void 0;
var GasStrategy;
(function (GasStrategy) {
    GasStrategy["AGGRESSIVE"] = "aggressive";
    GasStrategy["NORMAL"] = "normal";
    GasStrategy["CONSERVATIVE"] = "conservative";
    GasStrategy["ADAPTIVE"] = "adaptive";
})(GasStrategy || (exports.GasStrategy = GasStrategy = {}));
var CurvePoolType;
(function (CurvePoolType) {
    CurvePoolType["STABLE"] = "stable";
    CurvePoolType["CRYPTO"] = "crypto";
    CurvePoolType["META"] = "meta";
    CurvePoolType["FACTORY"] = "factory";
})(CurvePoolType || (exports.CurvePoolType = CurvePoolType = {}));
var TridentPoolType;
(function (TridentPoolType) {
    TridentPoolType["ConstantProduct"] = "constant-product";
    TridentPoolType["Concentrated"] = "concentrated";
    TridentPoolType["Stable"] = "stable";
    TridentPoolType["Hybrid"] = "hybrid";
})(TridentPoolType || (exports.TridentPoolType = TridentPoolType = {}));
//# sourceMappingURL=index.js.map