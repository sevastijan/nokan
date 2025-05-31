import BoardList from "../components/BoardList";

export default function DashboardPage() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <BoardList />
    </main>
  );
}
