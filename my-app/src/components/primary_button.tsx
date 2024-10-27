"use client"

export default function PrimaryButton({ value, onClickFunction, children } : { value: string, onClickFunction: React.MouseEventHandler, children: JSX.Element }) {

    return (
        <button onClick={onClickFunction} className="flex justify-center items-center font-inter font-semibold bg-[#0582FF] text-white rounded-lg px-5 py-2.5 text-base leading-[1.438rem] mr-2">
            {children}
            {value}
        </button>
    );
}