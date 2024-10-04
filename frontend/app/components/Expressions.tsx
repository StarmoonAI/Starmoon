"use client";
import { expressionColors, isExpressionColor } from "@/lib/expressionColors";
import { CSSProperties } from "react";
import * as R from "remeda";

export default function Expressions({
    values,
}: {
    values: Record<string, number>;
}) {
    const top3 = R.pipe(
        values,
        R.entries(),
        R.sortBy(R.pathOr([1], 0)),
        R.reverse(),
        R.take(3)
    );

    return (
        <div
            className={
                "text-xs p-3 w-full border-t border-border flex flex-col md:flex-row gap-3 bg-stone-50 rounded-b-[7px]"
            }
        >
            {top3.map(([key, value], index) => (
                <div className={"w-full overflow-hidden"} key={index}>
                    <div
                        className={
                            "flex items-center justify-between gap-1 font-mono pb-1"
                        }
                    >
                        <div className="flex flex-row items-center gap-2 px-2">
                            <div
                                className="rounded-full w-4 h-4 opacity-70"
                                style={
                                    {
                                        backgroundColor: isExpressionColor(key)
                                            ? expressionColors[key]
                                            : "var(--bg)",
                                    } as CSSProperties
                                }
                            />
                            <div className={"font-medium truncate"}>{key}</div>
                            <div className={"tabular-nums text-xs opacity-40"}>
                                {Math.round(value)}%
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
