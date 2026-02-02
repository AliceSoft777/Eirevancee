"use client";

"use client";

import { useState, useEffect } from "react";
import { Calculator, ArrowLeftRight, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product } from "@/lib/supabase-types";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

/* ===========================
   TYPES
=========================== */

export interface CalculatorValues {
  area: number; // ALWAYS m²
  areaWithWaste: number;
  boxes: number;
  estimatedTotal: number;
  hasValues: boolean;
  width?: number;
  length?: number;
  useWastage: boolean;
  unit: "m2" | "ft2" | "yd2";
}

interface TileCalculatorProps {
  product: Product;
  compact?: boolean;
  onCalculationChange?: (values: CalculatorValues) => void;
}

/* ===========================
   UNIT CONVERSION (AUTHORITATIVE)
=========================== */

/**
 * 1 m²  = 10.7639 ft²
 * 1 m²  = 1.19599 yd²
 * 1 yd² = 9 ft²
 */

function areaToSqm(area: number, unit: "m2" | "ft2" | "yd2") {
  if (unit === "ft2") return area / 10.7639;
  if (unit === "yd2") return area / 1.19599;
  return area;
}

function areaFromSqm(area: number, unit: "m2" | "ft2" | "yd2") {
  if (unit === "ft2") return area * 10.7639;
  if (unit === "yd2") return area * 1.19599;
  return area;
}

function dimensionsToSqm(
  width: number,
  length: number,
  unit: "m2" | "ft2" | "yd2"
) {
  return areaToSqm(width * length, unit);
}

/**
 * Coverage MUST be m² PER BOX
 */
export function parseCoveragePerBox(coverage?: string): number {
  if (!coverage) return 0;
  // Match decimal number followed by m2, sqm, sq m, or SQM
  const match = coverage.match(/([\d.]+)\s*(m²|sqm|sq\s*m|square\s*meter|sq\s*ft|ft²)/i);
  return match ? parseFloat(match[1]) : 0;
}

/* ===========================
   COMPONENT
=========================== */

export function TileCalculator({
  product,
  compact = false,
  onCalculationChange,
}: TileCalculatorProps) {
  const [coverage, setCoverage] = useState("");
  const [boxes, setBoxes] = useState("");
  const [width, setWidth] = useState("");
  const [length, setLength] = useState("");
  const [useWastage, setUseWastage] = useState(false);
  const [lastEdited, setLastEdited] = useState<
    "coverage" | "boxes" | "dimensions" | null
  >(null);
  const [unit, setUnit] = useState<"m2" | "ft2" | "yd2">("m2");

  /* ===========================
     NORMALIZED VALUES
  =========================== */

  const coveragePerBox = parseCoveragePerBox(product.sqm_per_box || undefined);

  const coverageNum = parseFloat(coverage) || 0;
  const boxesNum = parseInt(boxes) || 0;
  const widthNum = parseFloat(width) || 0;
  const lengthNum = parseFloat(length) || 0;

  /* ===========================
     BASE AREA (m²)
  =========================== */

  let baseAreaSqm = 0;

  if (lastEdited === "coverage") {
    baseAreaSqm = areaToSqm(coverageNum, unit);
  } else if (lastEdited === "dimensions") {
    baseAreaSqm = dimensionsToSqm(widthNum, lengthNum, unit);
  } else if (lastEdited === "boxes") {
    baseAreaSqm = boxesNum * coveragePerBox;
  } else {
    // Initial state or unexpected
    if (coverageNum > 0) {
      baseAreaSqm = areaToSqm(coverageNum, unit);
    } else if (boxesNum > 0) {
      baseAreaSqm = boxesNum * coveragePerBox;
    }
  }

  const areaWithWaste = useWastage ? baseAreaSqm * 1.1 : baseAreaSqm;

  /* ===========================
     Derived Box Calculation
  =========================== */

  const calculatedBoxes =
    coveragePerBox > 0 ? Math.ceil(areaWithWaste / coveragePerBox) : boxesNum;

  // Sync boxes input automatically if user is NOT typing boxes manually
  useEffect(() => {
    if (lastEdited !== "boxes" && lastEdited !== null) {
      setBoxes(calculatedBoxes.toString());
    }
  }, [calculatedBoxes, lastEdited]);

  /* ===========================
     SYNC LOGIC
  =========================== */

  useEffect(() => {
    if (lastEdited === "coverage" && coveragePerBox) {
      if (coverageNum > 0) {
        setBoxes(Math.ceil(areaWithWaste / coveragePerBox).toString());
      } else {
        setBoxes("");
      }
    }
  }, [coverageNum, areaWithWaste, coveragePerBox, lastEdited]);

  useEffect(() => {
    if (lastEdited === "boxes" && coveragePerBox) {
      if (boxesNum > 0) {
        const sqm = boxesNum * coveragePerBox;
        setCoverage(areaFromSqm(sqm, unit).toFixed(2));
      } else {
        setCoverage("");
      }
    }
  }, [boxesNum, coveragePerBox, unit, lastEdited]);

  useEffect(() => {
    if (lastEdited === "dimensions" && coveragePerBox) {
      if (widthNum > 0 && lengthNum > 0) {
        const sqm = dimensionsToSqm(widthNum, lengthNum, unit);
        setCoverage(areaFromSqm(sqm, unit).toFixed(2));
        setBoxes(Math.ceil(sqm / coveragePerBox).toString());
      } else {
        setCoverage("");
        setBoxes("");
      }
    }
  }, [widthNum, lengthNum, unit, coveragePerBox, lastEdited]);

  /* ===========================
     PRICING
  =========================== */

  const priceValue = product.price || 0;
  const estimatedTotal = calculatedBoxes * priceValue;
  const hasValues = calculatedBoxes > 0;

  /* ===========================
     CALLBACK
  =========================== */

  useEffect(() => {
    onCalculationChange?.({
      area: baseAreaSqm,
      areaWithWaste,
      boxes: calculatedBoxes,
      estimatedTotal,
      hasValues,
      width: widthNum || undefined,
      length: lengthNum || undefined,
      useWastage,
      unit,
    });
  }, [
    baseAreaSqm,
    areaWithWaste,
    calculatedBoxes,
    estimatedTotal,
    hasValues,
    widthNum,
    lengthNum,
    useWastage,
    unit,
    onCalculationChange,
  ]);

  /* ===========================
     RENDER
  =========================== */

  return (
    <Card className="border-none neu-raised bg-[#E5E9F0] rounded-[2rem] overflow-hidden">
      <CardHeader>
        <CardTitle className="font-serif text-2xl font-bold flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          Tile Calculator
        </CardTitle>
        <CardDescription>Estimate how many boxes you need for your project.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="pl-1">Select Unit</Label>
            <div className="flex bg-white/30 rounded-full p-1 border border-white/20">
              {(["m2", "ft2", "yd2"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`flex-1 py-1 text-xs font-bold rounded-full transition-all ${
                    unit === u ? "bg-white shadow-md text-primary" : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {u === "m2" ? "Metres" : u === "ft2" ? "Feet" : "Yards"}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="pl-1">Wastage</Label>
            <div className="flex items-center gap-2 h-10 px-4 bg-white/30 rounded-full border border-white/20">
              <input
                type="checkbox"
                id="wastage-calculator"
                checked={useWastage}
                onChange={(e) => setUseWastage(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary"
              />
              <span className="text-xs font-medium text-slate-600">Add 10% waste</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="length-calc" className="pl-1">Length ({unit === 'm2' ? 'M' : unit === 'ft2' ? 'FT' : 'YD'})</Label>
            <Input
              id="length-calc"
              type="number"
              placeholder="0.00"
              value={length}
              onChange={(e) => {
                setLength(e.target.value);
                setLastEdited("dimensions");
              }}
              className="bg-white/20 border-none neu-inset rounded-xl h-12 font-bold"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="width-calc" className="pl-1">Width ({unit === 'm2' ? 'M' : unit === 'ft2' ? 'FT' : 'YD'})</Label>
            <Input
              id="width-calc"
              type="number"
              placeholder="0.00"
              value={width}
              onChange={(e) => {
                setWidth(e.target.value);
                setLastEdited("dimensions");
              }}
              className="bg-white/20 border-none neu-inset rounded-xl h-12 font-bold"
            />
          </div>
        </div>

        <div className="divider h-px bg-white/30 my-2" />

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 font-medium">Area to cover:</span>
            <span className="font-bold">{baseAreaSqm.toFixed(2)} m² / {areaFromSqm(baseAreaSqm, unit).toFixed(2)} {unit}</span>
          </div>
          {useWastage && (
            <div className="flex items-center justify-between text-sm text-primary">
              <span className="font-medium">Total area (+10%):</span>
              <span className="font-bold">{areaWithWaste.toFixed(2)} m²</span>
            </div>
          )}
          <div className="flex items-center justify-between p-4 bg-white/40 rounded-2xl border border-white/20">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recommended</p>
              <h4 className="text-2xl font-bold text-slate-800">{calculatedBoxes} Boxes</h4>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estimated Total</p>
              <h4 className="text-2xl font-bold text-primary">{formatPrice(estimatedTotal)}</h4>
            </div>
          </div>
        </div>
      </CardContent>
      {!compact && (
        <CardFooter className="bg-white/20 pt-6 px-6 pb-6">
          <Button className="w-full bg-tm-red hover:bg-tm-red/90 text-white font-bold h-12 rounded-xl shadow-lg flex items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95">
            <ShoppingCart className="h-4 w-4" />
            Add Result to Cart
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
