import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BENCHMARK_DATA } from '../constants';

const BenchmarkChart: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">Performance Benchmark: ZK Verification</h2>
            <p className="text-gray-400">Monad Testnet vs. Ethereum Sepolia (Simulated)</p>
        </div>

        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Verification Time */}
            <div className="bg-monad-secondary/20 p-6 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-monad-primary mb-4 text-center">Confirmation Time (Seconds)</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={BENCHMARK_DATA} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                            <XAxis type="number" stroke="#888" />
                            <YAxis dataKey="name" type="category" stroke="#fff" width={120} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#200052', borderColor: '#836EF9', color: '#fff' }} 
                                cursor={{fill: 'rgba(255,255,255,0.1)'}}
                            />
                            <Bar dataKey="verifyTime" radius={[0, 4, 4, 0]}>
                                {BENCHMARK_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.name.includes('Monad') ? '#836EF9' : '#4B5563'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Lower is better. Monad offers near-instant finality.</p>
            </div>

             {/* Gas Cost Proxy */}
             <div className="bg-monad-secondary/20 p-6 rounded-xl border border-white/5">
                <h3 className="text-lg font-semibold text-monad-primary mb-4 text-center">Estimated Cost (USD Equivalent)</h3>
                <div className="h-64 w-full flex items-end justify-center gap-8 px-8 pb-4 relative">
                     {/* Custom simple bar visualization for cost difference since scales are huge */}
                     <div className="w-24 bg-gray-600 rounded-t-lg relative group transition-all duration-500 hover:bg-gray-500" style={{height: '80%'}}>
                        <div className="absolute -top-6 left-0 right-0 text-center text-white font-mono">$15.00</div>
                        <div className="absolute bottom-2 left-0 right-0 text-center text-white/50 text-sm">Ethereum</div>
                     </div>
                     <div className="w-24 bg-monad-accent rounded-t-lg relative group transition-all duration-500 hover:bg-pink-500" style={{height: '5%'}}>
                        <div className="absolute -top-6 left-0 right-0 text-center text-white font-mono text-monad-accent">&lt;$0.01</div>
                        <div className="absolute bottom-2 left-0 right-0 text-center text-white/50 text-sm">Monad</div>
                     </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">Massive reduction in verification costs on Monad.</p>
            </div>
        </div>

        <div className="mt-8 p-4 bg-gradient-to-r from-monad-secondary to-monad-primary/20 rounded-lg border-l-4 border-monad-accent max-w-3xl">
            <h4 className="text-white font-bold mb-1">Why Monad for ZK-ML?</h4>
            <p className="text-gray-300 text-sm">
                ZK proofs are computationally heavy to verify on-chain. Monad's parallel execution and low gas fees make it feasible to verify complex ML models (like PriceGuard) frequently without bankrupting the protocol.
            </p>
        </div>
    </div>
  );
};

export default BenchmarkChart;