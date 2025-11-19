import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BENCHMARK_DATA } from '../constants';
import { BenchmarkData } from '../types';

const BenchmarkChart: React.FC = () => {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData[]>(BENCHMARK_DATA);
  const [isRealData, setIsRealData] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load real benchmark data
    fetch('/benchmark-data.json')
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        throw new Error('No real data');
      })
      .then((data: any[]) => {
        if (data && data.length >= 2) {
          // Convert real data to BenchmarkData format
          const formatted = data.map(item => ({
            name: item.network,
            gasUsed: parseInt(item.gasUsed),
            verifyTime: parseFloat(item.confirmationTime),
            tokenName: item.tokenName,
            gasCostToken: item.gasCostToken,
            gasCostUsd: item.gasCostUsd,
          }));
          setBenchmarkData(formatted);
          setIsRealData(true);
        }
      })
      .catch(() => {
        // Fallback to simulated data
        setIsRealData(false);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Find Sepolia and Monad data
  const sepolia = benchmarkData.find(d => d.name.includes('Sepolia') || d.name.includes('Ethereum'));
  const monad = benchmarkData.find(d => d.name.includes('Monad'));

  // Calculate improvements
  const timeImprovement = sepolia && monad 
    ? (sepolia.verifyTime / monad.verifyTime).toFixed(1)
    : null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 overflow-y-auto">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Performance Benchmark: ZK Verification</h2>
            <p className="text-gray-400">
              Monad Testnet vs. Ethereum Sepolia {isRealData ? '(Real Data)' : '(Simulated)'}
            </p>
            {isRealData && (
              <p className="text-xs text-monad-primary mt-2">
                ✅ Loaded from benchmark-data.json
              </p>
            )}
        </div>

        {loading ? (
          <div className="text-gray-400">Loading benchmark data...</div>
        ) : (
          <>
            <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Verification Time */}
                <div className="bg-monad-secondary/20 p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-semibold text-monad-primary mb-4 text-center">Confirmation Time (Seconds)</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={benchmarkData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                <XAxis type="number" stroke="#888" />
                                <YAxis dataKey="name" type="category" stroke="#fff" width={140} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#200052', borderColor: '#836EF9', color: '#fff' }} 
                                    cursor={{fill: 'rgba(255,255,255,0.1)'}}
                                    formatter={(value: number) => `${value.toFixed(2)}s`}
                                />
                                <Bar dataKey="verifyTime" radius={[0, 4, 4, 0]}>
                                    {benchmarkData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name.includes('Monad') ? '#836EF9' : '#4B5563'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Lower is better. {timeImprovement && `Monad is ${timeImprovement}x faster`}
                    </p>
                </div>

                {/* Gas Units Used */}
                <div className="bg-monad-secondary/20 p-6 rounded-xl border border-white/5">
                    <h3 className="text-lg font-semibold text-monad-primary mb-4 text-center">Gas Units Used</h3>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={benchmarkData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                                <XAxis type="number" stroke="#888" />
                                <YAxis dataKey="name" type="category" stroke="#fff" width={140} />
                                <Tooltip 
                                    contentStyle={{ backgroundColor: '#200052', borderColor: '#836EF9', color: '#fff' }} 
                                    cursor={{fill: 'rgba(255,255,255,0.1)'}}
                                    formatter={(value: number) => value.toLocaleString()}
                                />
                                <Bar dataKey="gasUsed" radius={[0, 4, 4, 0]}>
                                    {benchmarkData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.name.includes('Monad') ? '#836EF9' : '#4B5563'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                      Gas units comparison (different token types: ETH vs MON)
                    </p>
                </div>
            </div>

            {/* Gas Cost Details */}
            {isRealData && sepolia && monad && (
              <div className="w-full max-w-4xl mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-monad-secondary/20 p-6 rounded-xl border border-white/5">
                  <h3 className="text-lg font-semibold text-monad-primary mb-4 text-center">Gas Cost (Ethereum Sepolia)</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {sepolia.gasCostToken} {sepolia.tokenName || 'ETH'}
                    </div>
                    {sepolia.gasCostUsd && (
                      <div className="text-lg text-gray-400">
                        ~${parseFloat(sepolia.gasCostUsd).toFixed(4)} USD
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-monad-secondary/20 p-6 rounded-xl border border-white/5">
                  <h3 className="text-lg font-semibold text-monad-primary mb-4 text-center">Gas Cost (Monad Testnet)</h3>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {monad.gasCostToken} {monad.tokenName || 'MON'}
                    </div>
                    <div className="text-lg text-gray-400">
                      Testnet token (price N/A)
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      ⚠️ Cannot compare costs directly (ETH vs MON are different tokens)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Improvements Summary */}
            {timeImprovement && (
              <div className="mt-8 p-6 bg-gradient-to-r from-monad-secondary to-monad-primary/20 rounded-lg border-l-4 border-monad-accent max-w-3xl w-full">
                <h4 className="text-white font-bold mb-2">🎯 Monad Performance Improvements</h4>
                <div className="space-y-2 text-gray-300 text-sm">
                  <p>✅ <strong>{timeImprovement}x faster</strong> confirmation time</p>
                  {sepolia && monad && (
                    <p>
                      ⚠️ <strong>Gas cost:</strong> Sepolia uses {sepolia.tokenName || 'ETH'}, Monad uses {monad.tokenName || 'MON'} (different tokens, cannot compare directly)
                    </p>
                  )}
                  {sepolia && monad && (
                    <p>
                      📊 <strong>Gas units:</strong> Monad uses {monad.gasUsed.toLocaleString()} vs Sepolia's {sepolia.gasUsed.toLocaleString()} 
                      ({monad.gasUsed > sepolia.gasUsed ? 'more' : 'less'} units, but {timeImprovement}x faster)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Why Monad */}
            <div className="mt-8 p-4 bg-gradient-to-r from-monad-secondary to-monad-primary/20 rounded-lg border-l-4 border-monad-accent max-w-3xl w-full">
                <h4 className="text-white font-bold mb-1">Why Monad for ZK-ML?</h4>
                <p className="text-gray-300 text-sm">
                    ZK proofs are computationally heavy to verify on-chain. Monad's parallel execution and fast finality make it feasible to verify complex ML models (like PriceGuard) frequently with sub-second confirmation times, enabling real-time AI-driven risk management.
                </p>
            </div>
          </>
        )}
    </div>
  );
};

export default BenchmarkChart;
