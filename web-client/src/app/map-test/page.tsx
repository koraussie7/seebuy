'use client';

import dynamic from 'next/dynamic';

// 대시보드와 동일한 TaskMap 컴포넌트를 인증 없이 확인하기 위한 테스트 페이지
const TaskMap = dynamic(() => import('@/components/TaskMap'), {
    ssr: false,
    loading: () => <div className="w-screen h-screen flex items-center justify-center bg-gray-100">Loading Map...</div>,
});

const sampleTasks = [
    { id: '1', title: 'Sample Task A', description: 'Test marker in Seoul', price: 50, latitude: 37.5665, longitude: 126.978 },
    { id: '2', title: 'Sample Task B', description: 'Test marker in NYC', price: 80, latitude: 40.7128, longitude: -74.006 },
];

export default function MapTestPage() {
    return (
        <div className="w-screen h-screen">
            <TaskMap tasks={sampleTasks} />
        </div>
    );
}

