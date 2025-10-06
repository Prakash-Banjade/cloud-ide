import React, { useState, useEffect, useRef } from 'react';

interface StreamEvent {
    type: string;
    agent?: string;
    data?: any;
    timestamp: string;
}

export const StreamingAgent: React.FC = () => {
    const [prompt, setPrompt] = useState('Build a colorful todo app in HTML, CSS, and JS');
    const [events, setEvents] = useState<StreamEvent[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const eventSourceRef = useRef<EventSource | null>(null);
    const eventsEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        eventsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [events]);

    const startStreaming = () => {
        if (!prompt) {
            alert('Please enter a prompt');
            return;
        }

        setEvents([]);
        setIsStreaming(true);

        const url = `http://localhost:3003/vibe/stream?user_prompt=${prompt}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                console.log(event.data)
                const data: StreamEvent = JSON.parse(event.data);
                setEvents((prev) => [...prev, data]);

                if (data.type === 'complete' || data.type === 'error') {
                    stopStreaming();
                }
            } catch (error) {
                console.error('Error parsing event:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE Error:', error);
            setEvents((prev) => [
                ...prev,
                {
                    type: 'error',
                    data: { error: 'Connection error' },
                    timestamp: new Date().toISOString(),
                },
            ]);
            stopStreaming();
        };
    };

    const stopStreaming = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsStreaming(false);
    };

    const clearEvents = () => {
        setEvents([]);
    };

    const formatEventType = (type: string): string => {
        const typeMap: Record<string, string> = {
            agent_start: '▶️ Agent Started',
            agent_end: '✅ Agent Completed',
            router_decision: '🔀 Router Decision',
            direct_response_complete: '💬 Direct Response',
            planner_plan_created: '📋 Plan Created',
            architect_task_created: '🏗️ Tasks Created',
            coder_task_start: '👨‍💻 Task Started',
            coder_task_complete: '✅ Task Completed',
            coder_all_complete: '🎉 All Tasks Complete',
            complete: '🎉 Execution Complete',
            error: '❌ Error',
        };
        return typeMap[type] || type;
    };

    const formatEventData = (type: string, data: any): string => {
        if (!data) return '';

        switch (type) {
            case 'router_decision':
                return `Route: ${data.route?.toUpperCase()}`;
            case 'direct_response_complete':
                return data.response;
            case 'planner_plan_created':
                return `Project: ${data.name}\nTech Stack: ${data.techstack}\nFiles: ${data.fileCount}`;
            case 'architect_task_created':
                return `Total Tasks: ${data.taskCount}\n\nTasks:\n${data.tasks?.map((t: any, i: number) => `${i + 1}. ${t.filepath}`).join('\n')}`;
            case 'coder_task_complete':
                return `Progress: ${data.currentStep}/${data.totalSteps}\nFile: ${data.filepath}`;
            case 'coder_all_complete':
                return `Completed ${data.totalSteps} tasks`;
            case 'error':
                return `Error: ${data.error}`;
            default:
                return JSON.stringify(data, null, 2);
        }
    };

    const getEventColor = (agent?: string, type?: string): string => {
        if (agent === 'router') return '#28a745';
        if (agent === 'direct') return '#17a2b8';
        if (agent === 'planner') return '#ffc107';
        if (agent === 'architect') return '#fd7e14';
        if (agent === 'coder') return '#6f42c1';
        if (type === 'complete') return '#28a745';
        if (type === 'error') return '#dc3545';
        return '#007bff';
    };

    useEffect(() => {
        return () => {
            stopStreaming();
        };
    }, []);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <div style={{ borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h1>🤖 Agent Streaming Demo</h1>

                <div style={{ marginBottom: '20px' }}>
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Enter your prompt"
                        style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '16px',
                        }}
                    />
                    <div style={{ marginTop: '10px' }}>
                        <button
                            onClick={startStreaming}
                            disabled={isStreaming}
                            style={{
                                padding: '12px 24px',
                                background: isStreaming ? '#ccc' : '#007bff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isStreaming ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                marginRight: '10px',
                            }}
                        >
                            {isStreaming ? 'Streaming...' : 'Start Streaming'}
                        </button>
                        <button
                            onClick={clearEvents}
                            style={{
                                padding: '12px 24px',
                                background: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '16px',
                            }}
                        >
                            Clear Events
                        </button>
                    </div>
                </div>

                <div
                    style={{
                        marginTop: '20px',
                        maxHeight: '600px',
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        padding: '15px',
                    }}
                >
                    {events.map((event, index) => (
                        <div
                            key={index}
                            style={{
                                padding: '10px',
                                marginBottom: '10px',
                                borderLeft: `4px solid ${getEventColor(event.agent, event.type)}`,
                                borderRadius: '4px',
                            }}
                        >
                            <div style={{ fontWeight: 'bold', color: '#007bff', marginBottom: '5px' }}>
                                {formatEventType(event.type)}
                            </div>
                            {event.agent && (
                                <div style={{ fontSize: '14px' }}>Agent: {event.agent}</div>
                            )}
                            {event.data && (
                                <div
                                    style={{
                                        marginTop: '5px',
                                        padding: '8px',
                                        borderRadius: '4px',
                                        fontFamily: 'monospace',
                                        fontSize: '13px',
                                        whiteSpace: 'pre-wrap',
                                    }}
                                >
                                    {formatEventData(event.type, event.data)}
                                </div>
                            )}
                            <div style={{ fontSize: '12px', color: '#999' }}>
                                {new Date(event.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    ))}
                    <div ref={eventsEndRef} />
                </div>
            </div>
        </div>
    );
};