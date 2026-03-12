"use client"

import { Button } from "@/components/ui/button"

import {
    Drawer,
    DrawerTrigger,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer"
import { MRForm } from "./MrForm"


export function Navbar() {
    return (
        <header className="border-b bg-white">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">

                <div className="font-semibold text-lg">
                    MR Visit System
                </div>

                <Drawer direction="left">
                    <DrawerTrigger asChild>
                        <Button>Add MR</Button>
                    </DrawerTrigger>

                    <DrawerContent className="p-6 max-w-md">
                        <DrawerHeader>
                            <DrawerTitle>Register New MR</DrawerTitle>
                            <DrawerDescription>
                                Add a medical representative to the system.
                            </DrawerDescription>
                        </DrawerHeader>

                        <div className="mt-6">
                            <MRForm />
                        </div>

                    </DrawerContent>
                </Drawer>

            </div>
        </header>
    )
}
