import { Card } from "@/components/ui/card"

export default async function DocsPage() {

    return (
        <main className="p-8 pb-20 grid 2xl:grid-cols-5 xl:grid-cols-3 gap-20">
            <section className="2xl:col-span-4 xl:col-span-2 space-y-16">
                <div className="space-y-6" id="why-qubide">
                    <h1 className="text-3xl font-semibold text-brand">Why Qubide?</h1>
                    <div className="space-y-4">
                        <p className="text-lg text-muted-foreground">
                            Qubide is a revolutionary cloud-based development environment that transforms how developers build and
                            deploy applications.
                        </p>

                        <h2 className="text-xl font-medium">What is Qubide?</h2>
                        <p>
                            Qubide is a comprehensive cloud IDE that provides a complete development environment accessible from
                            anywhere. It eliminates the complexity of local development setup while offering enterprise-grade features
                            and performance.
                        </p>

                        <h2 className="text-xl font-medium">Benefits over Local Development</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li>
                                <strong>Zero Setup Time:</strong> Start coding immediately without installing dependencies or
                                configuring environments
                            </li>
                            <li>
                                <strong>Consistent Environment:</strong> Same development environment across any platform
                            </li>
                            <li>
                                <strong>Scalable Resources:</strong> Access to powerful cloud computing resources on demand
                            </li>
                            <li>
                                <strong>Automatic Backups:</strong> Your code is automatically saved and synchronized in the cloud
                            </li>
                            <li>
                                <strong>Cross-Platform Access:</strong> Work from any device with a web browser
                            </li>
                            <li>
                                <strong>Multi language support:</strong> Support for multiple programming languages
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-6" id="getting-started">
                    <h1 className="text-3xl font-semibold text-brand">Getting Started</h1>
                    <div className="space-y-4">
                        <p className="text-lg text-muted-foreground">
                            Follow these simple steps to get your first project up and running on Qubide.
                        </p>

                        <div className="space-y-6">
                            <Card className="p-6">
                                <h3 className="text-lg font-semibold">Step 1: Create Your Account</h3>
                                <p>
                                    Sign up for a Qubide account or log in if you already have one. You can use your email address or sign
                                    in with your preferred social provider.
                                </p>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-semibold">Step 2: Create a New Project</h3>
                                <p>
                                    Once logged in, click on the &quot;Add Project&quot; button on your dashboard. This will open the project
                                    creation wizard where you can configure your new development environment.
                                </p>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-semibold">Step 3: Choose Your Technology Stack</h3>
                                <p>
                                    Select your preferred programming language and framework from our extensive list of supported
                                    technologies. Popular options include React, Node.js, Python, and many more.
                                </p>
                            </Card>

                            <Card className="p-6">
                                <h3 className="text-lg font-semibold">Step 4: Start Coding</h3>
                                <p>
                                    Your development environment will be automatically provisioned and ready in seconds. You can
                                    immediately start writing code, running tests, and building your application.
                                </p>
                            </Card>
                        </div>
                    </div>
                </div>

                <div className="space-y-6" id="storage">
                    <h1 className="text-3xl font-semibold text-brand">Storage</h1>
                    <div className="space-y-4">
                        <p className="text-lg text-muted-foreground">
                            Learn how Qubide securely stores and manages your code and project data.
                        </p>

                        <h2 className="text-xl font-medium">Secure Object Storage with MinIO</h2>
                        <p>
                            Qubide utilizes MinIO, a high-performance object storage system, to safely store all your code,
                            dependencies, and project assets. This enterprise-grade solution ensures your data is always secure,
                            accessible, and backed up.
                        </p>

                        <h2 className="text-xl font-medium">Key Storage Features</h2>
                        <ul className="list-disc list-inside space-y-2">
                            <li>
                                <strong>Redundant Storage:</strong> Your data is replicated across multiple servers for maximum
                                reliability
                            </li>
                            <li>
                                <strong>Encryption:</strong> All data is encrypted both in transit and at rest
                            </li>
                            <li>
                                <strong>Version Control:</strong> Automatic versioning ensures you never lose your work
                            </li>
                            <li>
                                <strong>Global Distribution:</strong> Fast access to your projects from anywhere in the world
                            </li>
                            <li>
                                <strong>Scalable Capacity:</strong> Storage automatically scales with your project needs
                            </li>
                            <li>
                                <strong>Real-time Sync:</strong> Changes are synchronized instantly across all your devices
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-6" id="keyboard-shortcuts">
                    <h1 className="text-3xl font-semibold text-brand">Keyboard Shortcuts</h1>
                    <div className="space-y-4">
                        <p className="text-lg text-muted-foreground">
                            Master these keyboard shortcuts to boost your productivity in Qubide.
                        </p>

                        <div className="grid gap-4">
                            <Card className="p-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold">Toggle Terminal</h3>
                                        <p className="text-muted-foreground">Show or hide the integrated terminal</p>
                                    </div>
                                    <div className="bg-muted px-3 py-1 rounded font-mono text-sm">Ctrl + `</div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold">Toggle Tab Switcher</h3>
                                        <p className="text-muted-foreground">Quick navigation between open files and tabs</p>
                                    </div>
                                    <div className="bg-muted px-3 py-1 rounded font-mono text-sm">Alt + E</div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-semibold">Manual Save</h3>
                                        <p className="text-muted-foreground">Force save current file (for confirmation)</p>
                                    </div>
                                    <div className="bg-muted px-3 py-1 rounded font-mono text-sm">Ctrl + S</div>
                                </div>
                            </Card>
                        </div>

                        <Card className="glass-effect p-6 rounded-lg mt-6">
                            <h3 className="text-lg font-semibold">Pro Tip</h3>
                            <p>
                                While Qubide automatically saves your work as you type, you can use Ctrl + S for manual confirmation
                                saves. This is especially useful when you want to ensure a specific checkpoint is saved before making
                                major changes.
                            </p>
                        </Card>
                    </div>
                </div>
            </section>

            <section className="sticky top-24 self-start space-y-4">
                <h2 className="text-xs font-medium text-muted-foreground">On This Page</h2>
                <ul className="space-y-3 text-sm">
                    <li>
                        <a href="#why-qubide" className="hover:text-brand text-muted-foreground transition-colors">
                            Why Qubide?
                        </a>
                    </li>
                    <li>
                        <a href="#getting-started" className="hover:text-brand text-muted-foreground transition-colors">
                            Getting Started
                        </a>
                    </li>
                    <li>
                        <a href="#storage" className="hover:text-brand text-muted-foreground transition-colors">
                            Storage
                        </a>
                    </li>
                    <li>
                        <a href="#keyboard-shortcuts" className="hover:text-brand text-muted-foreground transition-colors">
                            Keyboard Shortcuts
                        </a>
                    </li>
                </ul>
            </section>
        </main>
    )
}