const countersCacheKey = countersVarName = 'counters'
const incrementCacheKey = incrementVarName = 'increment'
const incrementCallCacheKey = 'incrementCall'
const defaultMaxCounterEnvlProp = 'MAX_CALLS'

function _incrementCallStatement(path) {
  const incrementCallStatement = this.cache.get(incrementCallCacheKey)

  path.get('body').unshiftContainer('body', incrementCallStatement)
}

module.exports = function(options = {}) {
  const maxCounterEnvProp = typeof options.maxCallsProp == 'string' ? options.maxCallsProp : defaultMaxCounterEnvlProp

  return function({
    types
  }) {
    return {
      pre(state) {
        this.cache = new Map();
      },

      visitor: {
        Program(path) {
          const countersID = path.scope.generateUidIdentifier(countersVarName)
          const incrementID = path.scope.generateUidIdentifier(incrementVarName)
          const executionErrorID = types.identifier('ExecutionError')
          const maxCallsID = types.identifier('process.env.' + maxCounterEnvProp)

          const counterDeclaration = types.variableDeclaration('let', [
            types.variableDeclarator(countersID, types.numericLiteral(0))
          ])

          const incrementDeclaration = types.functionDeclaration(incrementID, [], types.blockStatement([
            types.ifStatement(
              types.binaryExpression('>', countersID, maxCallsID),
              types.blockStatement([
                types.throwStatement(types.newExpression(executionErrorID, [
                  types.stringLiteral('Max calls exceeded')
                ]))
              ])
            ),
            types.expressionStatement(types.unaryExpression('++', countersID, true))
          ]))

          const incrementCall = types.expressionStatement(types.callExpression(incrementID, []))

          const unshiftOrder = [
            counterDeclaration,
            incrementDeclaration
          ]

          for (let declaration of unshiftOrder.reverse()) {
            path.unshiftContainer('body', declaration)
          }

          // caching
          this.cache.set(incrementCacheKey, incrementID)
          this.cache.set(incrementCallCacheKey, incrementCall)
        },

        FunctionDeclaration(path) {
          const incrementID = this.cache.get(incrementCacheKey)

          if (path.node.id !== incrementID) {
            _incrementCallStatement.call(this, path)
          }
        },

        WhileStatement: _incrementCallStatement,
        DoWhileStatement: _incrementCallStatement,
        ForStatement: _incrementCallStatement
      }
    }
  }
}
