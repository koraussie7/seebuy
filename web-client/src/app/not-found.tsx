import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <h1 className="text-6xl font-extrabold text-gray-900">404</h1>
            <p className="mt-4 text-lg text-gray-600">요청하신 페이지를 찾을 수 없습니다.</p>
            <Link
                href="/dashboard"
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
                대시보드로 돌아가기
            </Link>
        </div>
    );
}
