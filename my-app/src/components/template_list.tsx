"use client";

import { getTemplates, Template } from "@/app/services/templateServices";
import { useQuery } from "@tanstack/react-query";
import { TemplateItem } from "./template";
import { useCookies } from "next-client-cookies";



export const TemplateList = () => {

    const cookies = useCookies();

    const { data, status } = useQuery({
        queryKey: ["templates", ],
        queryFn: () => getTemplates(cookies.get("AuthorizationToken"))
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
                    userId = {template.userId}
                    title = {template.title}
                    coverImage = {template.coverImage}
                    isPublic = {template.isPublic}
                    createdBy = {template.createdBy.name}
                />
            ))}
        </div>
        </>
    )
}