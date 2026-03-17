import { useParams } from 'react-router-dom';

export function ProjectView() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Project View</h1>
      <p className="mt-4 text-gray-600">Project ID: {id}</p>
      <p className="mt-2 text-gray-600">Coming Soon</p>
    </div>
  );
}
