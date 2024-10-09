"use client";

import Folder from "./folder";
import foldersData from "../../public/static/json/folder.json";

export default function Notes() {
    let folderData = foldersData;
    
    return (
        <>
            <div className="p-3">
                <div>
                    <span className="font-inter text-[#91918E] text-xs leading-[0.75rem]">Notes</span>
                </div>
                <div>
                    {folderData.map((data, index) => (
                        <Folder key={index} folderId={data._id} name={data.name} documents={data.documents} />
                    ))}
                </div>
            </div>
        </>
    );
}