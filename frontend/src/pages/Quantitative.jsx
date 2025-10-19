import LesserKnownStocks from '../components/LesserKnownStocks.jsx';
import ContentBlock from '../components/ContentBlock.jsx';

export default function Quantitative() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Kantitatif Takip</h1>
      <ContentBlock slug="quantitative" className="mb-2" />
      <div className="rounded-2xl border bg-white p-4">
        <p className="text-gray-700">Kantitatif modellerle takip edilen göstergeler ve stratejiler bu bölümde sunulacaktır.</p>
      </div>
    </div>
  );
}