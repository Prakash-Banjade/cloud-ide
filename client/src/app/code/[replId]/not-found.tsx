import notFound from "@/assets/not-found.png"
import Footer from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function PorjectNotFound() {
    return (
        <div className="flex flex-col min-h-screen">
            <section className="grow flex flex-col items-center mt-[15vh] px-4">
                <Image
                    src={notFound}
                    alt="Project Not Found"
                    height={200}
                    width={500}
                    className="mx-auto dark:invert"
                />
                <h1 className="text-4xl font-extrabold text-center mb-4">Project Not Found</h1>
                <p className="text-center text-muted-foreground mb-4">The project you are looking for does not exist</p>
                <Button variant={'brand'} asChild>
                    <Link href={"/workspace"}>Go to Workspace</Link>
                </Button>
            </section>

            <section className="mt-auto">
                <Footer />
            </section>
        </div>
    )
}