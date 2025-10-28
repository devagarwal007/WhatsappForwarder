import { CheckCircle, ArrowRight } from 'lucide-react';
import type { Session } from '../App';

type Props = {
  session: Session;
  onContinue: () => void;
};

export default function SessionOverview({ session, onContinue }: Props) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">Session Overview</h1>
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Connected</span>
            </div>
          </div>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Session Name</dt>
                <dd className="mt-1 text-lg text-gray-900">{session.name}</dd>
              </div>
              
              {session.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="mt-1 text-gray-900">{session.description}</dd>
                </div>
              )}
            </dl>
          </div>

          <div className="mt-8">
            <button
              onClick={onContinue}
              className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Set Up Forwarding
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}