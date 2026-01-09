// C:\software_development\Api\Backend\src\middleware\permissionCheck.js

const Role = require('../models/roles');

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Permission check middleware factory
const checkPermission = (page, action) => {
  return asyncHandler(async (req, res, next) => {
    // Debug logging
    console.log('=== PERMISSION CHECK DEBUG ===');
    console.log('Checking:', { page, action });
    console.log('User:', {
      userId: req.user?.userId,
      isSuperAdmin: req.user?.isSuperAdmin,
      roleIdType: typeof req.user?.roleId,
      roleId: req.user?.roleId
    });

    // Superadmin bypass
    if (req.user && req.user.isSuperAdmin) {
      console.log('✅ Superadmin bypass');
      return next();
    }

    if (!req.user || !req.user.roleId) {
      console.log('❌ No role assigned');
      return res.status(403).json({ error: 'No role assigned' });
    }

    // Handle roleId being either an object or a string ID
    let role;
    if (typeof req.user.roleId === 'object' && req.user.roleId._id) {
      // roleId is already the full role object (from JWT)
      console.log('Role from JWT (object)');
      role = req.user.roleId;
    } else if (typeof req.user.roleId === 'object') {
      // It's an object but might not have _id at top level
      console.log('Role is object without _id, trying as-is');
      role = req.user.roleId;
    } else {
      // roleId is just the ID string, need to fetch from DB
      console.log('Role ID from JWT, fetching from DB');
      role = await Role.findById(req.user.roleId);
    }

    if (!role) {
      console.log('❌ Role not found');
      return res.status(403).json({ error: 'Role not found' });
    }

    console.log('Role found:', {
      roleName: role.roleName,
      permissionsCount: role.permissions?.length,
      permissions: role.permissions
    });

    const perm = role.permissions.find(p => p.page === page);
    console.log('Permission found for page:', perm);
    
    if (!perm) {
      console.log(`❌ No permission entry for page: ${page}`);
      return res.status(403).json({ 
        error: 'Forbidden — insufficient permission',
        debug: { 
          page, 
          action, 
          availablePages: role.permissions.map(p => p.page) 
        }
      });
    }

    if (perm[action] !== true) {
      console.log(`❌ Permission ${action} is ${perm[action]} for page ${page}`);
      return res.status(403).json({ 
        error: 'Forbidden — insufficient permission',
        debug: { page, action, permissionValue: perm[action] }
      });
    }

    console.log(`✅ Permission granted: ${page}.${action}`);
    console.log('=== END DEBUG ===\n');
    next();
  });
};

module.exports = { checkPermission };