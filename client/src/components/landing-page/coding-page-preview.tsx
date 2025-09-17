import Image from 'next/image'
import imgDark from '@/assets/coding_page-dark.jpeg'
import imgLight from '@/assets/coding_page-light.jpeg'

export default function CodingPagePreview() {
    return (
        <section className='mb-24 px-4 max-w-7xl mx-auto'>
            <section className='sm:p-5 p-3 rounded-xl bg-secondary shadow-lg'>
                <Image
                    src={imgDark}
                    alt="coding page preview"
                    width={1920}
                    height={1080}
                    className="dark:block hidden rounded-lg border border-background/50"
                />
                <Image
                    src={imgLight}
                    alt="coding page preview"
                    width={1920}
                    height={1080}
                    className="dark:hidden block rounded-lg border border-background/50"
                />
            </section>
        </section>
    )
}