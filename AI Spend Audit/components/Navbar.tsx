export default function Navbar() {
  return (
    <nav className="flex items-center justify-between p-6 border-b border-zinc-800">
      <h1 className="text-2xl font-bold">Credex Audit</h1>

      <button className="bg-white text-black px-4 py-2 rounded-lg">
        Start Audit
      </button>
    </nav>
  );
}
