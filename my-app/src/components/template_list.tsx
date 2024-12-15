"use client";

import { getTemplates, Template } from "@/app/services/templateServices";
import { useQuery } from "@tanstack/react-query";
import { TemplateItem } from "./template";



export const TemplateList = () => {

    const { data, status } = useQuery({
        queryKey: ["templates"],
        queryFn: () => getTemplates()
    });

    if (data == undefined) {
        return (
            <>
                <TemplateItem.Skeleton />
            </>
        )
    }

    return (
        <>
        <div className="grid grid-cols-3 gap-5">
            {data?.map((template: Template) => (
                <TemplateItem
                    key = {template._id}
                    _id = {template._id}
                    title = {template.title}
                />
            ))}
        </div>
        </>
    )
}