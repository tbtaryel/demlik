import ContentBlock from '../components/ContentBlock.jsx';

export default function IPO() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Halka Arz Başvurusu</h1>
      <ContentBlock slug="ipo" className="mb-2" />
      <div className="rounded-2xl border bg-white p-4">
        <p className="text-gray-700">Bu bölümde halka arz başvurularınızı iletebilirsiniz. Form ve akış kısa süre içinde eklenecektir.</p>
        <p className="mt-2 text-sm text-gray-500">Şimdilik bu sayfa bir yer tutucu olarak eklenmiştir; bağlantı çalışır durumdadır.</p>
      </div>
    </div>
  );
}