'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Next.js missing Leaflet marker
// (public/ 폴더의 정적 파일 사용 — Turbopack PNG 번들 이슈 회피)
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: '/marker-icon-2x.png',
    iconUrl: '/marker-icon.png',
    shadowUrl: '/marker-shadow.png',
});

// 여러 무료 타일 소스 자동 fallback (첫 소스 실패 시 순서대로 전환)
// CARTO 제거: 키 없는 요청에는 HTTP 200 + "API KEY REQUIRED" 워터마크 이미지를返하므로 제외
const TILE_SOURCES: { url: string; attribution: string; subdomains: string[] }[] = [
    {
        url: 'https://tile-c.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Tiles style by OSM France',
        subdomains: ['a', 'b', 'c'],
    },
    {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c'],
    },
];

interface Task {
    id: string;
    title: string;
    description: string;
    price: number;
    latitude: number;
    longitude: number;
    client?: { firstName: string; lastName: string };
}

interface TaskMapProps {
    tasks: Task[];
}

export default function TaskMap({ tasks }: TaskMapProps) {
    // Default center (e.g., center of the US, or you can change this to your local city)
    const defaultCenter: [number, number] = [39.8283, -98.5795];
    const zoomLevel = 4;

    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<L.LayerGroup | null>(null);

    // 지도 초기화 (1회)
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        let sourceIndex = 0;
        let errorCount = 0;

        const map = L.map(mapRef.current).setView(defaultCenter, zoomLevel);
        const tileLayer = L.tileLayer(TILE_SOURCES[0].url, {
            attribution: TILE_SOURCES[0].attribution,
            subdomains: TILE_SOURCES[0].subdomains,
        });

        tileLayer.on('tileerror', () => {
            errorCount += 1;
            if (errorCount >= 4 && sourceIndex < TILE_SOURCES.length - 1) {
                errorCount = 0;
                sourceIndex += 1;
                const next = TILE_SOURCES[sourceIndex];
                tileLayer.setUrl(next.url);
                tileLayer.options.attribution = next.attribution;
                tileLayer.options.subdomains = next.subdomains;
            }
        });
        tileLayer.addTo(map);

        markersRef.current = L.layerGroup().addTo(map);
        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
            markersRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // tasks 변경 시 마커 갱신
    useEffect(() => {
        if (!mapInstanceRef.current || !markersRef.current) return;

        markersRef.current.clearLayers();
        tasks.forEach((task) => {
            L.marker([task.latitude, task.longitude])
                .addTo(markersRef.current!)
                .bindPopup(
                    `<div class="p-1">
                        <h3 style="font-weight:700;font-size:1.05rem;margin-bottom:4px;"><a href="/dashboard/task/${task.id}" style="color:#2563eb;text-decoration:underline;">${task.title}</a></h3>
                        <p style="color:#4b5563;font-size:0.85rem;margin-bottom:8px;">${task.description}</p>
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px;">
                            <span style="background:#dcfce7;color:#166534;font-size:0.75rem;font-weight:600;padding:2px 10px;border-radius:4px;">$${task.price}</span>
                            <span style="font-size:0.75rem;color:#6b7280;">By ${task.client?.firstName || 'User'}</span>
                        </div>
                        <a href="/dashboard/task/${task.id}" style="display:block;margin-top:8px;color:#2563eb;font-size:0.85rem;font-weight:600;">상세 보기 →</a>
                    </div>`
                );
        });

        // 마커가 있으면 지도 범위를 마커에 맞게 조정
        if (tasks.length > 0) {
            const bounds = L.latLngBounds(tasks.map((t) => [t.latitude, t.longitude] as [number, number]));
            mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
        }
    }, [tasks]);

    return <div ref={mapRef} className="w-full h-full rounded-lg shadow-sm z-0" />;
}