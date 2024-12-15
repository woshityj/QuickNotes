"use client";

import { getTemplates } from "@/app/services/templateServices";
import SecondaryNavbar from "@/components/secondary-navbar";
import { TemplateList } from "@/components/template_list";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useParams, usePathname } from "next/navigation";
import { ElementRef, useEffect, useRef, useState } from "react";
import { toast } from "sonner";



export default function TemplatesPage() {

    const { data, status } = useQuery({
        queryKey: ["templates"],
        queryFn: () => getTemplates()
    });

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="px-24 mt-12">
                <div className="flex mb-10">
                    <a className="text-3xl font-semibold text-black cursor-pointer">Discover</a>
                    <a className="text-3xl font-semibold text-black opacity-15 ml-4 cursor-pointer hover:text-[#1761AB] hover:opacity-100">Work</a>
                    <a className="text-3xl font-semibold text-black opacity-15 ml-4 cursor-pointer hover:text-[#DB9400] hover:opacity-100">Life</a>
                    <a className="text-3xl font-semibold text-black opacity-15 ml-4 cursor-pointer hover:text-[#BA1D08] hover:opacity-100">School</a>
                </div>

                {/* <div className="columns-3 gap-5">
                    <div className="flex flex-col">
                        <img className="w-full aspect-auto" src="/static/images/template_img_1.jpeg" />
                        <p className="text-sm font-medium leading-5 mt-2.5">
                            Class Notes
                        </p>
                    </div>
                    
                    <div>
                        <img className="w-full aspect-auto" src="/static/images/template_img_1.jpeg" />
                        <p className="text-sm font-medium leading-5 mt-2.5">
                            Class Notes
                        </p>
                    </div>

                    <div>
                        <img className="w-full aspect-auto" src="/static/images/template_img_1.jpeg" />
                        <p className="text-sm font-medium leading-5 mt-2.5">
                            Class Notes
                        </p>
                    </div>
                </div> */}
                <TemplateList />
            </div>
        </div>
    );
}