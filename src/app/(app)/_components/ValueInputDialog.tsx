"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ValueInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habitName: string;
  currentValue: number;
  habitColor?: string | null;
  onSubmit: (value: number, mode: "replace" | "add") => void;
}

export function ValueInputDialog({
  open,
  onOpenChange,
  habitName,
  currentValue,
  habitColor,
  onSubmit,
}: ValueInputDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const hasExistingValue = currentValue > 0;

  const handleSubmit = (mode: "replace" | "add") => {
    const parsedValue = parseFloat(inputValue);
    if (isNaN(parsedValue) || parsedValue < 0) return;

    onSubmit(parsedValue, mode);
    setInputValue("");
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setInputValue("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: habitColor || "#C26A4A" }}
            />
            {habitName}
          </DialogTitle>
          <DialogDescription>
            {hasExistingValue
              ? `Current value today: ${currentValue}`
              : "No value logged today"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="value-input">Enter value</Label>
            <Input
              id="value-input"
              type="number"
              step="0.1"
              min="0"
              placeholder="0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit(hasExistingValue ? "add" : "replace");
                }
              }}
              autoFocus
              className="text-lg"
            />
          </div>

          <div className="flex gap-2">
            {hasExistingValue ? (
              <>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleSubmit("replace")}
                  disabled={!inputValue || parseFloat(inputValue) < 0}
                >
                  Replace ({inputValue || 0})
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleSubmit("add")}
                  disabled={!inputValue || parseFloat(inputValue) < 0}
                  style={{
                    backgroundColor: habitColor || undefined,
                  }}
                >
                  Add (+{inputValue || 0} ={" "}
                  {currentValue + (parseFloat(inputValue) || 0)})
                </Button>
              </>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleSubmit("replace")}
                disabled={!inputValue || parseFloat(inputValue) < 0}
                style={{
                  backgroundColor: habitColor || undefined,
                }}
              >
                Log {inputValue || 0}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
