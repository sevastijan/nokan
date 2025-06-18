"use client";

import Button from "@/app/components/Button/Button";

export default function TestButtonPage() {
  return (
    <div className="p-4 min-h-screen bg-gray-900 flex flex-col items-center justify-center">
      <h1 className="text-white mb-4">Button Test</h1>
      <Button
        variant="primary"
        size="md"
        onClick={() => {
          alert("Button clicked!");
        }}
      >
        Click Me
      </Button>
    </div>
  );
}
