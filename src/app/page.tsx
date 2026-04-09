"use client";

import { useState } from "react";
import { useTxStore } from "@/stores/fileStore";
import { ParsedTranscript } from "@/lib/types";

export default function Home() {
  const { file, setFile, data, setData } = useTxStore();

  const processFile = (file: File | undefined) => {
    if (file == undefined) alert("Please upload a file");
    else if (file.type === "application/pdf") {
      setFile(file);
      return;
    }
  };

  const handleParseTranscript = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/pdf",
        },
        body: file,
      });

      const data: ParsedTranscript = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      setData(data);
    } catch (error) {
      alert(error);
    }
  };

  return (
    <div className="flex flex-col items-center p-1">
      <p className="text-5xl">term planner</p>
      <p className="text-xl">upload your pdf file below</p>
      <input
        type="file"
        onChange={(e) => processFile(e.target.files?.[0])}
        className="border"
      ></input>
      <button onClick={handleParseTranscript}>parse transcript</button>
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  );
}
