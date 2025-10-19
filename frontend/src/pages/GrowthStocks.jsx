import RecommendedStocks from '../components/RecommendedStocks.jsx';
import ContentBlock from '../components/ContentBlock.jsx';

export default function GrowthStocks() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Büyüme Hisseleri</h1>
      <ContentBlock slug="growth-stocks" className="mb-2" />
      <p className="text-gray-700">Hızlı büyüme potansiyeli olan hisseleri burada takip edin.</p>
      <RecommendedStocks />
    </div>
  );
}